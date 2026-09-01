import { Dog, LineupRef, Position } from "../../helpers/types";

export interface CreateEditTaskFormType {
  description: string;
  dogs: string[];
  position: Position;
  matchupRef?: LineupRef;
}

export interface CreateEditTaskRequestType {
  description: string;
  dogs: Dog[];
  position: Position;
  matchupRef?: LineupRef;
}
