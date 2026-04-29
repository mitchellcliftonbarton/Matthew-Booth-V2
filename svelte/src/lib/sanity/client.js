import { createClient } from '@sanity/client';
import {createImageUrlBuilder} from '@sanity/image-url'

export const client = createClient({
	projectId: 'blzzqscv',
	dataset: 'production',
	apiVersion: '2024-07-19',
	useCdn: true
});

const builder = createImageUrlBuilder(client);

export const urlFor = (source) => {
	return builder.image(source);
};

export const getImageHeight = (width, aspectRatio) => {
	return width / aspectRatio;
};
