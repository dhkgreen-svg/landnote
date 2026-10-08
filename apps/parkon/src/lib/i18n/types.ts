export type Language = 'ko' | 'ja' | 'en';

export interface TranslationDictionary {
  app_name: string;
  slogan: string;
  header: {
    title: string;
    subtitle: string;
    lang_toggle_label: string;
  };
  nav: {
    home: string;
    courses: string;
    round: string;
    rules: string;
    chronicle: string;
    club: string;
    dining: string;
    market: string;
    weather: string;
  };
  pwa: {
    add_to_home: string;
    add_to_home_sub: string;
    installed: string;
  };
  hero: {
    tutorial_badge: string;
    share_with_friends: string;
    copy_url: string;
    copied: string;
    start_free_round: string;
    find_course: string;
    no_login_needed: string;
    npga_compliant: string;
  };
  round: {
    step1_title: string;
    step1_desc: string;
    step2_title: string;
    tee_shot_start: string;
    score_mode_zero: string;
    score_mode_par: string;
    edit_specs: string;
    move_hole: string;
    take_break: string;
    resume_round: string;
    view_scoreboard: string;
    close_scoreboard: string;
    ob_penalty: string;
    hole_out_next: string;
    round_finished: string;
    line_share: string;
    kakaotalk_share: string;
    share_results: string;
    local_rule_warning: string;
    best_guide: string;
    player_resting: string;
    strokes: string;
    putts: string;
    hole_in_one: string;
    total_score: string;
    under_par: string;
    over_par: string;
    finish_round: string;
    save_to_chronicle: string;
    guest_golfer: string;
  };
  rules: {
    title: string;
    safe_1mm: string;
    search_placeholder: string;
    official_rules: string;
  };
  medals: {
    chronicle_title: string;
    life_best_1: string;
    veteran_100: string;
    under_par_master: string;
    zero_ob_shield: string;
    national_pioneer: string;
    global_ambassador: string;
    hole_in_one: string;
    eagle: string;
    albatross: string;
    gourmet: string;
  };
  common: {
    confirm: string;
    cancel: string;
    save: string;
    edit: string;
    close: string;
    loading: string;
    free_market: string;
    all: string;
  };
}
