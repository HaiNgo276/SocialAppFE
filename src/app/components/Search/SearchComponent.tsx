import React, { useState, useEffect, useRef } from 'react'
import { Input, Spin, Avatar, Empty, message } from 'antd'
import { SearchOutlined, CloseOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons'
import { searchService } from '@/app/services/search.service'
import { SearchType, SearchResultDto, SearchHistoryDto } from '@/app/types/Search/SearchType'
import { useNavigate } from 'react-router-dom'
import { groupService } from '@/app/services/group.service'
import { GroupRole } from '@/app/types/Group/group.dto'
import { userService } from '@/app/services/user.service'

interface SearchComponentProps {
  show: boolean
  onClose: () => void
  onCollapseNavbar?: () => void
}

const SearchComponent: React.FC<SearchComponentProps> = ({ show, onClose, onCollapseNavbar }) => {
  const [searchValue, setSearchValue] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResultDto | null>(null)
  const [searchHistory, setSearchHistory] = useState<SearchHistoryDto[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [myGroupIds, setMyGroupIds] = useState<string[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')

  const debounceRef = useRef<NodeJS.Timeout>()
  const navigate = useNavigate()

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setIsVisible(true)
        loadSearchHistory()
      }, 150)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
      setSearchValue('')
      setSearchResults(null)
    }
  }, [show])

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await userService.getUserInfoByToken()
        if (response.status === 200 && response.data && 'id' in response.data) {
          setCurrentUserId(response.data.id)
        }
      } catch (error) {
        console.error('Error fetching current user:', error)
      }
    }
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const response = await groupService.getMyGroups(0, 100)
        const approvedGroupIds = (response.groups || [])
          .filter(group => {
            const userStatus = group.groupUsers?.find(gu => gu.userId === currentUserId)
            return userStatus && userStatus.roleName !== GroupRole.Pending
          })
          .map(group => group.id)
        setMyGroupIds(approvedGroupIds)
      } catch (error) {
        console.error('Error fetching my groups:', error)
      }
    }

    if (currentUserId) {
      fetchMyGroups()
    }
  }, [currentUserId])

  const loadSearchHistory = async () => {
    try {
      const response = await searchService.getRecentSearches(10)
      setSearchHistory(response.data || [])
    } catch (error) {
      console.error('Error loading search history:', error)
    }
  }

  const handleSearchPreview = async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults(null)
      return
    }

    setIsSearching(true)
    try {
      const response = await searchService.search(keyword, SearchType.All, 0, 10, false)
      setSearchResults(response.results || null)
    } catch (error) {
      console.error('Error searching:', error)
      message.error('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      handleSearchPreview(value)
    }, 500)
  }

  // Save search when user submits without selecting a suggestion
  const handleSearchSubmit = async () => {
    if (searchValue.trim()) {
      try {
        // Save only content when not selecting from suggestions
        await searchService.saveSearchHistory(searchValue.trim(), undefined, undefined)
        await loadSearchHistory()
      } catch (error) {
        console.error('Error saving search history:', error)
      }

      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`)
      onClose()
      setSearchValue('')
      setSearchResults(null)
    }
  }

  const handleDeleteHistory = async (historyId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await searchService.deleteSearchHistory(historyId)
      setSearchHistory(prev => prev.filter(item => item.id !== historyId))
      message.success('History cleared.')
    } catch (error) {
      console.error('Error deleting history:', error)
      message.error('Unable to clear history.')
    }
  }

  const handleClearAllHistory = async () => {
    try {
      await searchService.clearAllSearchHistory()
      setSearchHistory([])
      message.success('All history has been cleared.')
    } catch (error) {
      console.error('Error clearing history:', error)
      message.error('Unable to clear history.')
    }
  }

  const handleHistoryClick = (history: SearchHistoryDto) => {
    if (history.navigateUrl) {
      navigate(history.navigateUrl)
    } else if (history.content) {
      navigate(`/search?q=${encodeURIComponent(history.content)}`)
    }
    onClose()
    setSearchValue('')
    setSearchResults(null)
  }

  const handleResultClick = async (type: 'user' | 'group', item: any) => {
    try {
      if (type === 'user') {
        await searchService.saveSearchHistory(item.userName, item.avatarUrl || undefined, `/profile/${item.userName}`)
      } else if (type === 'group') {
        const isJoined = myGroupIds.includes(item.id)
        const navigateUrl = isJoined ? `/groups/${item.id}` : `/group/${item.id}`
        await searchService.saveSearchHistory(item.name, item.imageUrl || undefined, navigateUrl)
      }

      await loadSearchHistory()
    } catch (error) {
      console.error('Error saving search history:', error)
    }

    if (type === 'user') {
      navigate(`/profile/${item.userName}`)
    } else if (type === 'group') {
      const isJoined = myGroupIds.includes(item.id)
      if (isJoined) {
        navigate(`/groups/${item.id}`)
      } else {
        navigate(`/group/${item.id}`)
      }
    }
    onClose()
    setSearchValue('')
  }

  const handleClose = () => {
    onClose()
    onCollapseNavbar?.()
    setSearchValue('')
    setSearchResults(null)
  }

  const renderContent = () => {
    if (searchValue.trim() && searchResults) {
      const { users, groups } = searchResults
      const hasResults = (users && users.length > 0) || (groups && groups.length > 0)

      if (!hasResults) {
        return (
          <div className='flex items-center justify-center h-64'>
            <Empty description='No search results found.' image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )
      }

      return (
        <div className='overflow-y-auto'>
          {/* Users */}
          {users && users.map(user => (
            <div
              key={user.id}
              className='flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors'
              onClick={() => handleResultClick('user', user)}
            >
              <Avatar src={user.avatarUrl} size={44} icon={<UserOutlined />} />
              <div className='ml-3 flex-1 min-w-0'>
                <div className='font-semibold text-gray-900 text-sm'>{user.userName}</div>
                <div className='text-xs text-gray-500'>{user.firstName}</div>
              </div>
            </div>
          ))}

          {/* Groups */}
          {groups && groups.map(group => (
            <div
              key={group.id}
              className='flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors'
              onClick={() => handleResultClick('group', group)}
            >
              <Avatar src={group.imageUrl} size={44} icon={<TeamOutlined />} />
              <div className='ml-3 flex-1 min-w-0'>
                <div className='font-semibold text-gray-900 text-sm'>{group.name}</div>
                <div className='text-xs text-gray-500'>{group.isPublic ? 'Public' : 'Private'} Group</div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div>
        <div className='flex items-center justify-between px-4 py-3 border-b border-gray-200'>
          <h3 className='text-base font-bold text-gray-900'>Recent</h3>
          {searchHistory.length > 0 && (
            <button
              onClick={handleClearAllHistory}
              className='text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors'
            >
              Clear all
            </button>
          )}
        </div>

        {searchHistory.length === 0 ? (
          <div className='flex items-center justify-center h-64'>
            <Empty description='No recent searches.' image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <div className='overflow-y-auto'>
            {searchHistory.map(history => (
              <div
                key={history.id}
                className='flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors group'
                onClick={() => handleHistoryClick(history)}
              >
                <div className='flex items-center flex-1 min-w-0'>
                  {history.imageUrl ? (
                    <Avatar
                      src={history.imageUrl}
                      size={44} 
                      icon={history.navigateUrl?.includes('/profile') ? <UserOutlined /> : <TeamOutlined />}
                    />
                  ) : (
                    <div className='w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center'>
                      <SearchOutlined className='text-gray-500 text-lg' />
                    </div>
                  )}
                  <div className='ml-3 flex-1 min-w-0'>
                    <div className='text-sm font-semibold text-gray-900 truncate'>{history.content}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteHistory(history.id, e)}
                  className='ml-2 p-2 rounded-full text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100'
                >
                  <CloseOutlined className='text-base' />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {show && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300'
          onClick={handleClose}
        />
      )}

      <div
        className={`fixed top-0 bottom-0 left-0 bg-white shadow-2xl z-50 transition-all duration-300 ease-in-out ${
          show ? 'w-[400px]' : 'w-0'
        } overflow-hidden`}
      >
        <div
          className={`flex flex-col h-full transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className='flex items-center justify-between px-4 py-4 border-b border-gray-200'>
            <h2 className='text-2xl font-bold text-gray-900'>Search</h2>
          </div>

          <div className='px-4 py-3 border-b border-gray-200'>
            <Input
              placeholder='Search'
              value={searchValue}
              onChange={handleInputChange}
              onPressEnter={handleSearchSubmit}
              suffix={
                isSearching ? (
                  <Spin size='small' />
                ) : searchValue ? (
                  <CloseOutlined
                    className='text-gray-400 cursor-pointer hover:text-gray-600 transition-colors'
                    onClick={() => {
                      setSearchValue('')
                      setSearchResults(null)
                    }}
                  />
                ) : null
              }
              className='rounded-lg'
              style={{
                backgroundColor: '#efefef',
                border: 'none'
              }}
              size='large'
            />
          </div>

          <div className='flex-1 overflow-hidden'>{renderContent()}</div>
        </div>
      </div>
    </>
  )
}

export default SearchComponent