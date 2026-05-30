 
export interface Job {
  id: number;
  recruiter_id: number;
  title: string;
  contract_type: 'CDI' | 'CDD' | 'Stage' | 'Alternance' | 'Freelance';
  location: string;
  workplace_type: 'Présentiel' | 'Hybride' | 'Télétravail';
  salary?: string;
  experience_level: string;
  missions_desc: string;
  profile_desc: string;
  status: 'disponible' | 'fermé';
  expires_at?: string;
  company_name?: string;
  company_logo?: string;
}
