import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Place {
    id: string;
    name: string;
    category: string;
    description?: string;
    image_url?: string;
    rating?: number;
    lat: number;
    lng: number;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    theme: string;
    places: Place[];
}

export async function fetchCoursesByLocale(localeName: string) {
    // 1. Find Locale
    const { data: locale } = await supabase
        .from('locales')
        .select('*')
        .ilike('name', `%${localeName}%`)
        .single();

    if (!locale) return null;

    // 2. Fetch Courses
    const { data: courses } = await supabase
        .from('courses')
        .select(`
      id, title, description, theme,
      course_places (
        sequence_order,
        place:places (*)
      )
    `)
        .eq('locale_id', locale.id)
        .order('created_at', { ascending: false });

    if (!courses) return { locale, courses: [] };

    // 3. Transform Data
    const formattedCourses = courses.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        theme: c.theme,
        places: c.course_places
            .sort((a: any, b: any) => a.sequence_order - b.sequence_order)
            .map((cp: any) => ({
                id: cp.place.id,
                name: cp.place.name,
                category: cp.place.category,
                description: cp.place.description,
                rating: cp.place.rating,
                lat: cp.place.latitude,
                lng: cp.place.longitude,
                image_url: cp.place.image_url
            }))
    }));

    return { locale, courses: formattedCourses };
}
