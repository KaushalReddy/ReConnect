// Sample data for dashboard panels that depend on collections not built
// yet in this phase:
//   - events         -> Phase 6
//   - opportunities  -> Phase 6
//
// This is representative sample data only, used so those panels render
// realistic, populated states instead of empty shells. It's swapped for a
// live Firestore query in the phase that builds each collection — mentorship
// requests (Phase 4) and user data (Phases 1-2) are already live and no
// longer use sample data.

export interface SampleEvent {
  id: string;
  title: string;
  date: string;
  location: string;
}

export const sampleUpcomingEvents: SampleEvent[] = [
  { id: "evt-1", title: "Homecoming Networking Mixer", date: "Oct 18", location: "Alumni Hall" },
  { id: "evt-2", title: "Careers in Tech Panel", date: "Nov 4", location: "Virtual" },
];

export interface SampleOpportunity {
  id: string;
  title: string;
  company: string;
  type: "JOB" | "INTERNSHIP";
}

export const sampleOpportunities: SampleOpportunity[] = [
  { id: "opp-1", title: "Software Engineer, New Grad", company: "Nimbus Systems", type: "JOB" },
  { id: "opp-2", title: "Product Design Intern", company: "Harbor & Co.", type: "INTERNSHIP" },
];
