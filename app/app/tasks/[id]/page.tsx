"use client";

import { useParams } from "next/navigation";
import { TaskPage } from "@/components/app/task-page";

export default function Page() {
  const p = useParams();
  const id = Array.isArray(p.id) ? p.id[0] : (p.id as string);
  return <TaskPage id={id} />;
}
