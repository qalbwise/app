import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface RegisterBody {
  email: string;
  full_name: string;
  password: string;
}

export function useRegister() {
  return useMutation({
    mutationFn: (body: RegisterBody) => api.auth.register(body),
  });
}
