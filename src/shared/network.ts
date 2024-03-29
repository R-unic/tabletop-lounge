import { Networking } from "@flamework/networking";
import type { DataValue } from "./data-models/generic";
import type { GitHubInfo } from "./structs/github";
import type CardType from "./structs/cards/card-type";
import type Game from "./structs/game";

interface ServerEvents {
  data: {
    initialize(): void;
    set(directory: string, value: DataValue): void;
    increment(directory: string, amount?: number): void;
  };
  games: {
    advanceTurn(tableID: string): void;
    cards: {
      play(tableID: string, card: CardType, cframe: CFrame): void;
      draw(tableID: string): void;
    };
  };
}

interface ClientEvents {
  data: {
    updated(directory: string, value: DataValue): void;
  };
  games: {
    toggleCamera(tableID: string, on: boolean): void;
    ejectOccupant(tableID: string): void;
    turnChanged(tableID: string, turn: Player): void;
    cards: {
      addHand(tableID: string, hand: CardType[]): void;
      addToHand(tableID: string, card: CardType): void;
      draw(tableID: string, card: CardType): void;
      toggleDrawButton(_game: Game, on: boolean): void;
      toggleGameUI(_game: Game, on: boolean): void;
    };
  };
}

interface ServerFunctions {
  data: {
    get(directory: string): DataValue;
  };
  games: {
    cards: {
      canPlayCard(tableID: string, card: CardType): boolean;
    };
  };
  github: {
    getInfo(): GitHubInfo;
  };
}

interface ClientFunctions {}

export const GlobalEvents = Networking.createEvent<ServerEvents, ClientEvents>();
export const GlobalFunctions = Networking.createFunction<ServerFunctions, ClientFunctions>();
