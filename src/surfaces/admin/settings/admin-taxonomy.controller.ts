import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { TAXONOMY_KINDS, TaxonomyItemView, TaxonomyService } from '../../../modules/taxonomy';
import { RequirePermission } from '../require-permission.decorator';

const LIST_RESPONSE = {
  description: 'OK',
  schema: { type: 'object', required: ['data'], properties: { data: { type: 'array', items: { type: 'object' } } } },
};
const KIND_PARAM = { name: 'kind', description: `One of: ${TAXONOMY_KINDS.join(', ')}` };

/** Taxonomy lists on the settings screen (contracts/admin GET/PUT /taxonomy/{kind}). */
@ApiTags('Admin settings')
@ApiCookieAuth('adminSession')
@Controller('taxonomy')
export class AdminTaxonomyController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Get(':kind')
  @RequirePermission('settings.view')
  @ApiParam(KIND_PARAM)
  @ApiOkResponse(LIST_RESPONSE)
  list(@CurrentActor() actor: Actor, @Param('kind') kind: string): Promise<TaxonomyItemView[]> {
    return this.taxonomy.list(actor, kind);
  }

  /** Replaces the list; validated in the service (422 with field errors). */
  @Put(':kind')
  @RequirePermission('settings.manage')
  @ApiParam(KIND_PARAM)
  @ApiBody({ schema: { type: 'array', items: { type: 'object' } } })
  @ApiOkResponse(LIST_RESPONSE)
  replace(
    @CurrentActor() actor: Actor,
    @Param('kind') kind: string,
    @Body() body: unknown,
  ): Promise<TaxonomyItemView[]> {
    return this.taxonomy.replace(actor, kind, body);
  }
}
