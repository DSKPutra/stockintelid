import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  async message(
    @Body() body: { message: string; history?: { sender: 'user' | 'bot'; text: string }[] },
  ) {
    return this.chatbotService.processMessage(body.message, body.history || []);
  }
}
