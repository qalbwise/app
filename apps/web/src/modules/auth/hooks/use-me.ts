import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const useMe = () => {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: () => api.users.me(),
  });
};
