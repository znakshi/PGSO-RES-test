import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://vclckkfpydwjqxxqdznd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xF1R87snCXRQHc5TBRFPzw_DAlaxoT2";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
