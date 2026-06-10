export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string
          bio: string | null
          avatar_url: string | null
          banner_url: string | null
          city: string | null
          country: string
          engines: string[]
          roles: string[]
          experience: 'student' | 'hobbyist' | 'indie' | 'professional'
          availability: 'open' | 'building' | 'closed'
          website_url: string | null
          twitter_handle: string | null
          github_handle: string | null
          itch_handle: string | null
          onboarding_done: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      projects: {
        Row: {
          id: string
          developer_id: string
          slug: string
          title: string
          tagline: string | null
          description: string | null
          genre: string[]
          engine: string | null
          stage: 'prototype' | 'alpha' | 'beta' | 'released'
          cover_url: string | null
          screenshots: string[]
          playable_url: string | null
          is_public: boolean
          open_for_testers: boolean
          open_for_collabs: boolean
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'view_count' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      devlogs: {
        Row: {
          id: string
          project_id: string
          author_id: string
          title: string
          content: string
          images: string[]
          video_url: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['devlogs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['devlogs']['Insert']>
      }
      follows: {
        Row: { follower_id: string; following_id: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['follows']['Row'], 'created_at'>
        Update: never
      }
      reactions: {
        Row: {
          id: string
          user_id: string
          target_type: 'devlog' | 'project'
          target_id: string
          emoji: 'fire' | 'eyes' | 'star' | 'rocket'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reactions']['Row'], 'id' | 'created_at'>
        Update: never
      }
      comments: {
        Row: {
          id: string
          user_id: string
          target_type: 'devlog' | 'project'
          target_id: string
          content: string
          is_deleted: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'is_deleted' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['comments']['Row'], 'content' | 'is_deleted'>>
      }
      playtest_requests: {
        Row: {
          id: string
          project_id: string
          requester_id: string
          title: string
          description: string | null
          build_url: string | null
          platforms: string[]
          estimated_minutes: number | null
          focus_areas: string[]
          max_testers: number
          status: 'open' | 'closed' | 'completed'
          deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['playtest_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['playtest_requests']['Insert']>
      }
      waitlist: {
        Row: { id: string; name: string; email: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['waitlist']['Row'], 'id' | 'created_at'>
        Update: never
      }
      events: {
        Row: {
          id: string
          organizer_id: string
          title: string
          description: string | null
          city: string
          venue: string | null
          address: string | null
          event_date: string
          max_attendees: number | null
          is_online: boolean
          event_url: string | null
          is_published: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Profile  = Tables<'profiles'>
export type Project  = Tables<'projects'>
export type Devlog   = Tables<'devlogs'>
export type Follow   = Tables<'follows'>
export type Reaction = Tables<'reactions'>
export type Comment  = Tables<'comments'>
export type PlaytestRequest = Tables<'playtest_requests'>
export type Event    = Tables<'events'>
