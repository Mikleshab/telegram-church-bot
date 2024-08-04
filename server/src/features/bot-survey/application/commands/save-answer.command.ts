import { ICommand } from '@nestjs/cqrs';

export class SaveAnswerCommand implements ICommand {
  constructor(
    public readonly userId: number,
    public readonly questionIndex: number,
    public readonly answerIndex: number,
  ) {}
}
