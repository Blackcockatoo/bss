import { LearningPassport } from "@/components/teacher-lessons/LearningPassport";

export const metadata = { title: "My Learning Passport — MetaPet" };

export default function MyPassportPage() {
  return <LearningPassport audience="student" hubPath="/pet" />;
}
