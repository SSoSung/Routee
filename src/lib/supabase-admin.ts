import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 이 클라이언트는 "Admin Key"를 사용하므로 RLS(보안 정책)를 모두 무시하고 모든 작업을 수행할 수 있습니다.
// 절대 브라우저(클라이언트) 코드에서 import 하지 마세요! 오직 서버 사이드(API Route 등)에서만 사용해야 합니다.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
