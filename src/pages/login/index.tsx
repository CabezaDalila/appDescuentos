import AuthForm from "@/components/auth/AuthForm/AuthForm";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function LoginPage() {
  return <AuthForm />;
}
