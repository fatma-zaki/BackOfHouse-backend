import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { NotesService, NoteView } from '../../../modules/backoffice';
import { RequirePermission } from '../require-permission.decorator';

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };

function presentNote(n: NoteView) {
  return { id: n.id, body: n.body, author: n.author, created_at: n.createdAt.toISOString() };
}

/** Internal notes on a user or company (contracts/admin /{subject}/{id}/notes). */
@ApiTags('Admin users')
@ApiCookieAuth('adminSession')
@Controller(':subject/:id/notes')
export class AdminNotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  @RequirePermission('notes.view')
  @ApiOkResponse(OK)
  async list(@CurrentActor() actor: Actor | undefined, @Param('subject') subject: string, @Param('id') id: string) {
    return (await this.notes.list(actor, subject, id)).map(presentNote);
  }

  @Post()
  @RequirePermission('notes.write')
  @ApiBody({ schema: { type: 'object' } })
  @ApiCreatedResponse(OK)
  async add(
    @CurrentActor() actor: Actor | undefined,
    @Param('subject') subject: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return presentNote(await this.notes.add(actor, subject, id, body));
  }
}
