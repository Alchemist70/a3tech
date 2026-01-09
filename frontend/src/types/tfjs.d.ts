declare module '@tensorflow/tfjs';

declare module '@tensorflow-models/blazeface' {
	export type BlazeFaceModel = any;
	export interface Prediction {
		topLeft: [number, number];
		bottomRight: [number, number];
		probability: number[] | number;
		landmarks?: number[][];
	}
	export function load(): Promise<BlazeFaceModel>;
	const blazeface: {
		load: typeof load;
	};
	export default blazeface;
}
