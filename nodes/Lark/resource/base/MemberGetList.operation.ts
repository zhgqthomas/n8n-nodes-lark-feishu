import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import RequestUtils from '../../../help/utils/RequestUtils';
import { ResourceOperation } from '../../../help/type/IResource';

export default {
	name: 'Get Role Members | 列出协作者',
	value: 'getMemberList',
	order: 90,
	options: [
		{
			displayName: 'App Token(多维表格唯一标识)',
			name: 'app_token',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'Https://open.feishu.cn/document/server-docs/docs/bitable-v1/bitable-overview#d03706e3',
		},
		{
			displayName: 'Role ID(自定义角色唯一标识)',
			name: 'role_id',
			type: 'string',
			required: true,
			default: '',
		},
		{
			displayName: 'Whether Paging(是否分页)',
			name: 'whether_paging',
			type: 'boolean',
			default: false,
		},
		{
			displayName: 'Page Token(分页标记)',
			name: 'page_token',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
			displayOptions: {
				show: {
					whether_paging: [true],
				},
			},
		},
		{
			displayName: 'Page Size(分页大小)',
			name: 'page_size',
			type: 'number',
			default: 10,
			displayOptions: {
				show: {
					whether_paging: [true],
				},
			},
		},
	],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		const app_token = this.getNodeParameter('app_token', index) as string;
		const role_id = this.getNodeParameter('role_id', index) as string;
		const whetherPaging = this.getNodeParameter('whether_paging', index, false) as boolean;
		let pageToken = this.getNodeParameter('page_token', index, '') as string;
		const pageSize = this.getNodeParameter('page_size', index, 100) as number;

		const allMembers: IDataObject[] = [];
		let hasMore = false;
		do {
			const {
				code,
				msg,
				data: { has_more, page_token, items },
			} = await RequestUtils.request.call(this, {
				method: 'GET',
				url: `/open-apis/bitable/v1/apps/${app_token}/roles/${role_id}/members`,
				qs: {
					page_token: pageToken,
					page_size: pageSize,
				},
			});

			if (code !== 0) {
				throw new Error(`Error fetching base role members, code ${code}, message: ${msg}`);
			}

			hasMore = has_more;
			pageToken = page_token;
			allMembers.push(...items);
		} while (!whetherPaging && hasMore);

		return {
			has_more: hasMore,
			page_token: pageToken,
			items: allMembers,
		};
	},
} as ResourceOperation;
