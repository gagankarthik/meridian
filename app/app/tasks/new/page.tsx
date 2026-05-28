"use client";

import { Suspense } from "react";
import { TaskCreate } from "@/components/app/task-create";

export default function Page() {
  return (
    <Suspense>
      <TaskCreate />
    </Suspense>
  );
}
