export interface SocialApp {
  id?: number;
  app_name: string;
  username: string;
}

export interface ContactLookup {
  id: number;
  primary_username: string;
  profile_picture: string | null;
}

export interface Contact {
  id: number;
  profile_picture: string | null;
  primary_username: string;
  primary_messaging_app: string;
  flag_avoid: number;
  flag_twisted: number;
  flag_favorite: number;
  flag_hot: number;
  real_name: string | null;
  date_of_birth: string | null;
  phone_number: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  have_we_met: number;
  hang_out_again: string | null;
  hang_out_again_explanation: string | null;
  who_interested_in_meeting: string | null;
  likelihood_of_meeting: number;
  interest_top: number;
  interest_bottom: number;
  interest_vers: number;
  interest_oral: number;
  interest_making_out: number;
  interest_leather: number;
  interest_gear: number;
  interest_cum: number;
  interest_body_contact: number;
  interest_passionate: number;
  interest_rough: number;
  interest_groups: number;
  interest_threeways: number;
  created_at: string;
  updated_at: string;
  social_apps?: SocialApp[];
  associations?: ContactLookup[];
  photos?: any[];
  direct_conversations?: any[];
  indirect_conversations?: any[];
}

export interface ContactFormData {
  primary_username: string;
  primary_messaging_app: string;
  flag_avoid: boolean;
  flag_twisted: boolean;
  flag_favorite: boolean;
  flag_hot: boolean;
  real_name: string;
  date_of_birth: string;
  phone_number: string;
  email: string;
  city: string;
  state: string;
  country: string;
  have_we_met: boolean;
  hang_out_again: string;
  hang_out_again_explanation: string;
  who_interested_in_meeting: string;
  likelihood_of_meeting: number;
  interest_top: boolean;
  interest_bottom: boolean;
  interest_vers: boolean;
  interest_oral: boolean;
  interest_making_out: boolean;
  interest_leather: boolean;
  interest_gear: boolean;
  interest_cum: boolean;
  interest_body_contact: boolean;
  interest_passionate: boolean;
  interest_rough: boolean;
  interest_groups: boolean;
  interest_threeways: boolean;
  social_apps: SocialApp[];
  associations: number[];
}

export interface Conversation {
  id: number;
  subject: string;
  primary_contact_id: number;
  primary_username?: string;
  profile_picture?: string | null;
  date_time: string;
  application: string;
  location: string | null;
  conversation_summary: string | null;
  participants?: ContactLookup[];
}

export interface ConversationFormData {
  subject: string;
  primary_contact_id: number | null;
  date_time: string;
  application: string;
  location: string;
  conversation_summary: string;
  additional_contact_ids: number[];
}

export const MESSAGING_APPS = ['Zoom','Telegram','Teleguard','Signal','Teams','Facebook','Sniffies','Scruff','Grindr','Other'];
export const CONVERSATION_APPS = ['Zoom Group Room','Zoom Private Room','Text Message','Email','Phone Call','In Person','Telegram','Teleguard','Signal','Scruff','Grindr','Sniffies','Facebook Messenger','Teams','Other'];
export const HANG_OUT_OPTIONS = ['Hell Ya','Hopefully','Who Knows','Probably Not','Hell No'];
export const MEETING_INTEREST_OPTIONS = ['I am interested in meeting','They are interested in meeting','We both are interested in meeting','Neither of us are interested in meeting','DO NOT MEET'];
export const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];
export const COUNTRIES = ['United States','Canada','Mexico','United Kingdom','Germany','France','Spain','Italy','Netherlands','Australia','Brazil','Japan','Other'];
