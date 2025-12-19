export const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  const n = bstr.length
  const u8arr = new Uint8Array(n)

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i)
  }

  return new File([u8arr], filename, { type: mime })
}

export const getTimeAgo = (dateString: string) => {
  let normalizedDateString = dateString
  if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
    normalizedDateString = dateString + 'Z'
  }

  const postTime = new Date(normalizedDateString)
  const now = new Date()

  if (isNaN(postTime.getTime())) {
    return 'Invalid time'
  }

  const diffInMs = now.getTime() - postTime.getTime()

  const diffInSeconds = Math.floor(diffInMs / 1000)
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)
  const diffInWeeks = Math.floor(diffInDays / 7)
  const diffInMonths = Math.floor(diffInDays / 30)
  const diffInYears = Math.floor(diffInDays / 365)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks} weeks ago`
  } else if (diffInMonths < 12) {
    return `${diffInMonths} months ago`
  } else {
    return `${diffInYears} years ago`
  }
}
