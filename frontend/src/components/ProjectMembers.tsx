import React, { useEffect, useState } from 'react'
import { Users, UserPlus, Loader2, Trash2 } from 'lucide-react'
import { Project, User as AppUser } from '../types'
import { projectService, userService } from '../services/api'

interface ProjectMembersProps {
    projectId: number
    canEdit: boolean
}

const ProjectMembers: React.FC<ProjectMembersProps> = ({ projectId, canEdit }) => {
    const [members, setMembers] = useState<AppUser[]>([])
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState<AppUser[]>([])
    const [loading, setLoading] = useState(false)

    const loadMembers = async () => {
        try {
            setLoading(true)
            // There's no explicit members list endpoint returning users in our services
            // We can fetch project and read members if serializer returns users
            // Fallback: keep local state updated on add/remove
            const proj = await projectService.getProject(projectId)
            const users = (proj.data as any)?.members?.map((m: any) => m.user) || []
            setMembers(users)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadMembers()
    }, [projectId])

    const handleSearch = async (q: string) => {
        setQuery(q)
        if (q.length < 2) { setSearchResults([]); return }
        try {
            const res = await userService.searchUsers(q)
            setSearchResults(res.data)
        } catch (e) {
            setSearchResults([])
        }
    }

    const addMember = async (userId: number) => {
        await projectService.addMember(projectId, userId)
        setQuery('')
        setSearchResults([])
        await loadMembers()
    }

    const removeMember = async (userId: number) => {
        await projectService.removeMember(projectId, userId)
        await loadMembers()
    }

    return (
        <div>
            <div className="flex items-center mb-3">
                <Users className="w-4 h-4 mr-2" />
                <h4 className="font-medium text-gray-900">Team Members</h4>
            </div>
            {canEdit && (
                <div className="mb-4">
                    <div className="relative">
                        <input
                            placeholder="Search users..."
                            className="w-full px-3 py-2 border rounded-md"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        <UserPlus className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
                    </div>
                    {searchResults.length > 0 && (
                        <div className="mt-2 border rounded-md bg-white shadow">
                            {searchResults.map((u) => (
                                <button key={u.id} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between" onClick={() => addMember(u.id)}>
                                    <span>@{u.username}</span>
                                    <span className="text-xs text-gray-500">Add</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {loading ? (
                <div className="flex items-center text-gray-500 text-sm"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</div>
            ) : (
                <div className="space-y-2">
                    {members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                            <div className="text-sm text-gray-700">@{m.username}</div>
                            {canEdit && (
                                <button className="text-red-600 hover:text-red-700" onClick={() => removeMember(m.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                    {members.length === 0 && <div className="text-sm text-gray-500">No members yet.</div>}
                </div>
            )}
        </div>
    )
}

export default ProjectMembers


