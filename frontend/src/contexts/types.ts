import { Dog, Task, User } from "../helpers/types";
import { Dispatch, SetStateAction } from "react";

export interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  setUser: Dispatch<SetStateAction<User>>;
  setUserDogs: (dogs: Dog[]) => void;
  setUserLanguage: (language: "en" | "pl") => void;
}

export interface AppContextType {
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
}
