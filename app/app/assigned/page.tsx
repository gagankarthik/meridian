import { redirect } from "next/navigation";

// Consolidated into the single "My Tasks" view with tabs.
export default function AssignedPage() {
  redirect("/app/my-tasks?view=assigned");
}
