// eslint-disable-next-line import/prefer-default-export
export const commands = [
	{ name: 'ping' },
	{ name: 'invite' },
	{ name: 'play' },
	{
		name: 'episode',
		options: [
			{
				name: 'season',
				value: 1,
			},
			{
				name: 'episode',
				value: 1,
			},
		],
	},
];
