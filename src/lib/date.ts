import dayjs from "dayjs"
import duration from "dayjs/plugin/duration.js"
import isBetween from "dayjs/plugin/isBetween.js"
import relativeTime from "dayjs/plugin/relativeTime.js"
import timezone from "dayjs/plugin/timezone.js"
import utc from "dayjs/plugin/utc.js"

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(relativeTime)

export { dayjs }

export const isValidDate = (date: any) => dayjs(date).isValid()
