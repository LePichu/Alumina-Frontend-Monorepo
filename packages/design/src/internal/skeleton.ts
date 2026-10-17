import { isServer } from "solid-js/web"

/** The class a skeleton block wears. Take it from here rather than writing it
 *  out: importing this module is what keeps skeletons in step.
 *
 *  The `skeleton` utility in `theme.css` gives each block the same fade, and a
 *  CSS animation starts when its element appears — so two blocks that arrive
 *  half a second apart breathe half a second apart, for ever. Below, every such
 *  animation is moved to start at the page's own zero as it begins. They are
 *  then the same animation at the same moment, whenever each was mounted.
 */
export const SKELETON = "skeleton"

/** The keyframes' name in `theme.css`. */
const NAME = "skeleton"

const align = (animations: Animation[]) => {
	for (const animation of animations) {
		if (animation instanceof CSSAnimation && animation.animationName === NAME) {
			animation.startTime = 0
		}
	}
}

if (!isServer) {
	// `animationstart` bubbles, so one listener hears every skeleton on the page.
	document.addEventListener("animationstart", (event) => {
		if (event.animationName === NAME && event.target instanceof Element) {
			align(event.target.getAnimations())
		}
	})
	// And the ones the server rendered, which began before this loaded.
	align(document.getAnimations())
}
