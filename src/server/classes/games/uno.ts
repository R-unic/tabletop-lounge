import { Events } from "server/network";
import { Assets, isNaN } from "shared/utilities/helpers";
import { getCardObject, getGameInfo } from "shared/utilities/game";
import { type UnoCard, UnoSuit } from "shared/structs/cards/games/uno";
import CardGame from "../base-games/card-game";
import Game from "shared/structs/game";
import Turns from "../turns";
import type CardType from "shared/structs/cards/card-type";

const COLORED_CARDS = 2;
const WILDCARDS = 4;
const DRAW_FOUR_CARDS = 4;
const CARD_PILE_DISTANCE = 1; // distance between the pile of cards to draw and cards already played
const STACKING_ALLOWED = false; // standard uno

// TODO: track score
// TODO: winners
export default class Uno extends CardGame<Game.Uno> {
  public static readonly name = Game.Uno;

  protected readonly playedPileOffset = this.tableTop.CFrame.LookVector.mul(-CARD_PILE_DISTANCE);
  protected readonly drawPileOffset = this.tableTop.CFrame.LookVector.mul(CARD_PILE_DISTANCE);
  protected readonly handSize = 7;

  private readonly turns = new Turns(this);
  private currentSuit = UnoSuit.Wild;

  public start(): void {
    super.start();
    this.turns.start();
    task.delay(0.5, () => this.placeFirstCard());
    this.janitor.Add(this.cardPlayed.Connect(card => {
      this.currentSuit = card.suit;
      this.updateDrawButtonVisibility();
    }));
    this.janitor.Add(this.cardDrew.Connect(() => this.updateDrawButtonVisibility()));
    Events.games.cards.toggleGameUI.fire(this._table.getSatPlayers(), Game.Uno, true);
  }

  private updateDrawButtonVisibility(): void {
    for (const participant of this._table.getSatPlayers()) {
      const isTurn = this.turns.is(participant);
      const hand = this.getHand(participant);
      const noCardsToPlay = hand.every(card => !this.canPlayCard(participant, card)) && hand.size() !== 0;
      Events.games.cards.toggleDrawButton(participant, Game.Uno, isTurn && noCardsToPlay);
    }
  }

  protected canPlayCard(player: Player, card: UnoCard): boolean {
    const lastCard = this.getLastCardObject();
    const validMatch = lastCard.name === card.name || this.currentSuit === card.suit;
    let canPlayCard = this.isTurn(player, card.game);

    if (this.isNumberCard(lastCard) && this.isNumberCard(card))
      canPlayCard &&= validMatch;
    else {
      const lastCardWasDrawCard = lastCard.name === "DrawFour" || lastCard.name === "DrawTwo";
      const attemptingToStack = (lastCard.name === "DrawFour" && card.name === "DrawFour") || (lastCard.name === "DrawTwo" && card.name === "DrawTwo");
      if (lastCardWasDrawCard)
        if (attemptingToStack)
          canPlayCard &&= STACKING_ALLOWED;
        else
          canPlayCard &&= (lastCard.name === "DrawTwo" ? validMatch : true);
      else {
        const lastOrCurrentCardIsWild = this.currentSuit === UnoSuit.Wild || card.suit === UnoSuit.Wild;
        canPlayCard &&= lastOrCurrentCardIsWild ? true : validMatch;
      }
    }

    // if it's a card without a suit, e.x. wildcard, you can play any card on it
    return canPlayCard;
  }

  protected createDeck(): void {
    const cards = Assets.Games.Uno.Cards;
    const suitedCards = [cards.Red, cards.Green, cards.Yellow, cards.Blue].map(suit => <Part[]>suit.GetChildren());
    for (const suited of suitedCards)
      for (const card of suited)
        this.addToDeck(card, COLORED_CARDS);

    this.addToDeck(cards.Wildcard, WILDCARDS);
    this.addToDeck(cards.DrawFour, DRAW_FOUR_CARDS);
  }

  private placeFirstCard(): void {
    const cardModel = this.deck.pop()!;
    const card = getCardObject(Game.Uno, cardModel);
    this.playCard(card, cardModel.CFrame.mul(CFrame.Angles(math.rad(90), 0, math.rad(180))));
  }

  private isTurn(player: Player, _game: Game): boolean {
    const { turnBased } = getGameInfo(_game);
    return turnBased && this.turns.is(player);
  }

  private isNumberCard(card: CardType): boolean {
    const n = tonumber(card.name);
    return n !== undefined && !isNaN(n);
  }
}
