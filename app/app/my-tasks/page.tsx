import { Suspense } from "react";
import { MyTasksList } from "@/components/app/my-tasks-list";

export const metadata = { title: "My tasks" };

export default function MyTasksPage() {
  return (
    <Suspense>
      <MyTasksList />
    </Suspense>
  );
}
