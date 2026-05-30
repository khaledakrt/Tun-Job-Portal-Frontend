 
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'candidate' | 'recruiter';
  phone?: string;
  address?: string;
  company_name?: string;
  company_bio?: string;
  company_logo?: string;
}

export interface CVStructure {
  title: string;
  summary: string;
  experiences: Array<{ role: string; company: string; duration: string; desc: string }>;
  educations: Array<{ degree: string; school: string; year: string }>;
  skills: string;
}
