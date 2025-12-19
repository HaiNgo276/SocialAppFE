import { useState, useCallback } from 'react'
import { groupService } from '../services/group.service'
import { GroupDto } from '../types/Group/group.dto'
import { message } from 'antd'

export const useGroups = () => {
  const [groups, setGroups] = useState<GroupDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [skip, setSkip] = useState(0)
  const take = 10

  // Fetch groups
  const fetchGroups = useCallback(
    async (reset: boolean = false) => {
      try {
        setLoading(true)
        setError(null)

        const currentSkip = reset ? 0 : skip
        const response = await groupService.getAllGroups(currentSkip, take)

        if (response.groups && response.groups.length > 0) {
          if (reset) {
            setGroups(response.groups)
            setSkip(take)
          } else {
            setGroups((prev) => [...prev, ...response.groups])
            setSkip((prev) => prev + take)
          }

          setHasMore(response.groups.length === take)
        } else {
          if (reset) {
            setGroups([])
          }
          setHasMore(false)
        }
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || 'Failed to fetch groups'
        setError(errorMessage)
        message.error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [skip, take]
  )

  // Fetch my groups
  const fetchMyGroups = useCallback(
    async (reset: boolean = false) => {
      try {
        setLoading(true)
        setError(null)

        const currentSkip = reset ? 0 : skip
        const response = await groupService.getMyGroups(currentSkip, take)

        if (response.groups && response.groups.length > 0) {
          if (reset) {
            setGroups(response.groups)
            setSkip(take)
          } else {
            setGroups((prev) => [...prev, ...response.groups])
            setSkip((prev) => prev + take)
          }

          setHasMore(response.groups.length === take)
        } else {
          if (reset) {
            setGroups([])
          }
          setHasMore(false)
        }
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || 'Failed to fetch your groups'
        setError(errorMessage)
        message.error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [skip, take]
  )

  // Load more
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchGroups(false)
    }
  }, [loading, hasMore, fetchGroups])

  // Refetch
  const refetch = useCallback(() => {
    setSkip(0)
    setHasMore(true)
    fetchGroups(true)
  }, [fetchGroups])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Handle group created
  const handleGroupCreated = useCallback(() => {
    refetch()
  }, [refetch])

  // Handle group updated
  const handleGroupUpdated = useCallback((updatedGroup: GroupDto) => {
    setGroups((prev) => prev.map((group) => (group.id === updatedGroup.id ? updatedGroup : group)))
  }, [])

  // Handle group deleted
  const handleGroupDeleted = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((group) => group.id !== groupId))
    message.success('Group deleted successfully')
  }, [])

  return {
    groups,
    loading,
    error,
    hasMore,
    fetchGroups,
    fetchMyGroups,
    loadMore,
    refetch,
    clearError,
    handleGroupCreated,
    handleGroupUpdated,
    handleGroupDeleted
  }
}
