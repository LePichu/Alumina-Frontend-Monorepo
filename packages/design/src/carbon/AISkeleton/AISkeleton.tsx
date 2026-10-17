import { SkeletonIcon, SkeletonPlaceholder, SkeletonText } from "../Skeleton/Skeleton"
import type {
	SkeletonIconProps,
	SkeletonPlaceholderProps,
	SkeletonTextProps,
} from "../Skeleton/Skeleton"

/** Carbon's AI skeletons (preview, as of @carbon/react 1.118): the skeleton for
 *  content a model is still producing.
 *
 *  In Carbon they are the ordinary skeletons with the AI gradient run through
 *  them. That gradient is hue and nothing else, so nothing of it is left here:
 *  these are the ordinary skeletons under Carbon's names, kept so that code
 *  written against Carbon's API — and Carbon's docs — still lines up. If
 *  generated content is ever to be marked while it loads, the mark is an
 *  `AILabel` beside it, not a different grey.
 */
export function AISkeletonText(props: SkeletonTextProps) {
	return <SkeletonText {...props} />
}

export function AISkeletonPlaceholder(props: SkeletonPlaceholderProps) {
	return <SkeletonPlaceholder {...props} />
}

export function AISkeletonIcon(props: SkeletonIconProps) {
	return <SkeletonIcon {...props} />
}
