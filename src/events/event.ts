import { TReducedUnitData } from "../helpers/unit";
import { EResult } from "../scenes/battle";

export enum EEventType {
  Fight = "Fight",
  Buff = "Buff",
  Resource = "Resource",
  Ranged = "Ranged",
  Result = "Result",
}

export enum EResource {
  Gold = "Gold",
}

interface IEvent {
  type: EEventType;
  duration: number;
  affectedUnitIds: string[];
  perishedUnitIds: string[];
}

export interface IBuffEvent extends IEvent {
  type: EEventType.Buff;
  attackAmount: number;
  healthAmount: number;
  sourceId: string;
  untilEndOfBattleOnly: boolean;
}

export interface IResourceEvent extends IEvent {
  type: EEventType.Resource;
  sourceId: string;
  resource: EResource;
  amount: number;
  startAmount: number;
}

export interface IFightEvent extends IEvent {
  type: EEventType.Fight;
}

export interface IRangedEvent extends IEvent {
  type: EEventType.Ranged;
  attackAmount: number;
  sourceId: string;
}

interface IResultEvent extends IEvent {
  type: EEventType.Result;
  result: EResult;
}

export type TBattleEvent =
  | IFightEvent
  | IBuffEvent
  | IRangedEvent
  | IResultEvent
  | IResourceEvent;

export type TShopEvent = IBuffEvent | IResourceEvent;

export type TTimelineEvent<Type> = Type & {
  myUnits: TReducedUnitData[];
  opponentsUnits: TReducedUnitData[];
};
