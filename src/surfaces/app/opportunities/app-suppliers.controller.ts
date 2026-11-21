import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Actor } from '../../../common/context/actor';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { OpportunitiesService, SupplierResponsesService, SupplierResponseView } from '../../../modules/opportunities';
import { CompanyAccountOnly } from '../account-context';
import { presentProject } from '../directory/app-presenters';
import { presentCompanySummary, presentOpportunity } from './app-opportunity.presenters';

const OK = { description: 'OK', schema: { type: 'object', properties: { data: {} } } };
const OBJECT_BODY = { schema: { type: 'object' } };

/** contracts/app `SupplierResponse`. `proposed_price` is null unless the caller is the buyer or responder. */
export function presentSupplierResponse(v: SupplierResponseView) {
  return {
    id: v.id,
    request_id: v.requestId,
    request_title: v.requestTitle,
    buyer: presentCompanySummary(v.buyer),
    responder: presentCompanySummary(v.responder),
    message: v.message,
    proposed_price: v.proposedPrice,
    setup_time: v.setupTime,
    status: v.status,
    submitted_at: v.submittedAt.toISOString(),
    updated_at: v.updatedAt.toISOString(),
    projects: v.projects.map(presentProject),
  };
}

/**
 * Supplier requests and responses between companies (contracts/app
 * /company/supplier-requests*, /company/supplier-responses*). Company Accounts only.
 */
@ApiTags('Suppliers')
@ApiBearerAuth()
@CompanyAccountOnly()
@Controller('company')
export class AppSuppliersController {
  constructor(
    private readonly opportunities: OpportunitiesService,
    private readonly responses: SupplierResponsesService,
  ) {}

  @Get('supplier-requests/invited')
  @ApiOkResponse(OK)
  async invited(@CurrentActor() actor: Actor | undefined) {
    return (await this.opportunities.invitedRequests(actor)).map(presentOpportunity);
  }

  @Get('supplier-requests/:id')
  @ApiOkResponse(OK)
  async request(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentOpportunity(await this.opportunities.supplierRequest(actor, id));
  }

  @Get('supplier-requests/:id/responses')
  @ApiOkResponse(OK)
  async forRequest(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return (await this.responses.forRequest(actor, id)).map(presentSupplierResponse);
  }

  @Get('supplier-responses')
  @ApiOkResponse(OK)
  async mine(@CurrentActor() actor: Actor | undefined) {
    return (await this.responses.mine(actor)).map(presentSupplierResponse);
  }

  @Post('supplier-responses')
  @CompanyAccountOnly('RESPOND_TO_SUPPLIER_REQUESTS')
  @ApiBody(OBJECT_BODY)
  @ApiCreatedResponse(OK)
  async respond(@CurrentActor() actor: Actor | undefined, @Body() body: unknown) {
    return presentSupplierResponse(await this.responses.respond(actor, body));
  }

  @Get('supplier-responses/:id')
  @ApiOkResponse(OK)
  async detail(@CurrentActor() actor: Actor | undefined, @Param('id') id: string) {
    return presentSupplierResponse(await this.responses.get(actor, id));
  }

  @Post('supplier-responses/:id/status')
  @HttpCode(200)
  @CompanyAccountOnly('MANAGE_OPPORTUNITIES')
  @ApiBody(OBJECT_BODY)
  @ApiOkResponse(OK)
  async changeStatus(@CurrentActor() actor: Actor | undefined, @Param('id') id: string, @Body() body: unknown) {
    return presentSupplierResponse(await this.responses.changeStatus(actor, id, body));
  }
}
