import { MyTasksList } from "@/components/app/my-tasks-list";

export const metadata = { title: "Created by me" };

export default function CreatedPage() {
  return <MyTasksList mode="created" />;
}
