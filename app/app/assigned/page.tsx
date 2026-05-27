import { MyTasksList } from "@/components/app/my-tasks-list";

export const metadata = { title: "Assigned to me" };

export default function AssignedPage() {
  return <MyTasksList mode="assigned" />;
}
