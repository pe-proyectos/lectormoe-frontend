import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import {
    Textarea,
    Button,
    ButtonGroup,
    Dialog,
    Spinner,
    DialogHeader,
    DialogBody,
    Checkbox,
    DialogFooter,
    Typography,
    Input,
} from "@material-tailwind/react";
import {
    UserCircleIcon,
    LockClosedIcon,
    CreditCardIcon,
} from "@heroicons/react/24/solid";
import { callAPI } from '../../util/callApi';
import { getTranslator } from "../../util/translate";

export function AdminMemberDialog({ organization, open, setOpen, member, setMember }) {
    const _ = getTranslator(organization.language);

    // dialog
    const [loading, setLoading] = useState(false);
    const [currentTab, setCurrentTab] = useState('member');
    // form
    const [role, setRole] = useState('');
    const [description, setDescription] = useState('');
    const [hierarchyLevel, setHierarchyLevel] = useState(0);
    const [permissions, setPermissions] = useState({
        canSeeAdminPanel: false,
        canEditOrganization: false,
        canDeleteOrganization: false,
        canInviteMember: false,
        canEditMember: false,
        canDeleteMember: false,
        canCreateAuthor: false,
        canCreateMangaProfile: false,
        canCreateMangaCustom: false,
        canEditMangaCustom: false,
        canDeleteMangaCustom: false,
        canCreateGenre: false,
        canEditGenre: false,
        canDeleteGenre: false,
        canCreateChapter: false,
        canEditChapter: false,
        canDeleteChapter: false,
        canCreatePage: false,
        canEditPage: false,
        canDeletePage: false,
        canCreateCoinpack: false,
        canEditCoinpack: false,
        canDeleteCoinpack: false,
    });
    const [coinpacks, setCoinpacks] = useState([]);

    useEffect(() => {
        callAPI(`/api/coinpack`)
        .then(({ data }) => {
            console.log(data);
            setCoinpacks(data);
        })
        .catch(error => toast.error(error?.message));
    }, []);

    useEffect(() => {
        if (!member) return;
        setRole(member.role || "");
        setDescription(member.description || "");
        setHierarchyLevel(member.hierarchyLevel || 0);
        setPermissions({
            canSeeAdminPanel: member.canSeeAdminPanel,
            canEditOrganization: member.canEditOrganization,
            canDeleteOrganization: member.canDeleteOrganization,
            canInviteMember: member.canInviteMember,
            canEditMember: member.canEditMember,
            canDeleteMember: member.canDeleteMember,
            canCreateAuthor: member.canCreateAuthor,
            canCreateMangaProfile: member.canCreateMangaProfile,
            canCreateMangaCustom: member.canCreateMangaCustom,
            canEditMangaCustom: member.canEditMangaCustom,
            canDeleteMangaCustom: member.canDeleteMangaCustom,
            canCreateGenre: member.canCreateGenre,
            canEditGenre: member.canEditGenre,
            canDeleteGenre: member.canDeleteGenre,
            canCreateChapter: member.canCreateChapter,
            canEditChapter: member.canEditChapter,
            canDeleteChapter: member.canDeleteChapter,
            canCreatePage: member.canCreatePage,
            canEditPage: member.canEditPage,
            canDeletePage: member.canDeletePage,
            canCreateCoinpack: member.canCreateCoinpack,
            canEditCoinpack: member.canEditCoinpack,
            canDeleteCoinpack: member.canDeleteCoinpack,
        });
    }, [member]);

    const handleSubmit = async () => {
        if (!role) {
            return toast.error(_('role_mandatory'));
        }
        const formData = new FormData();
        formData.append('role', role);
        if (description) formData.append('description', description);
        formData.append('hierarchyLevel', hierarchyLevel);
        // Append permissions to formData
        Object.keys(permissions).forEach(key => {
            formData.append(key, permissions[key]);
        });
        setLoading(true);
        callAPI(member ? `/api/member/${member.id}` : '/api/member', {
            method: member ? 'PATCH' : 'POST',
            body: formData,
        })
            .then(response => {
                toast.success(_('member_updated'));
                setMember(null);
                setRole('');
                setDescription('');
                setHierarchyLevel(0);
                const permissionsSetToFalse = {};
                Object.keys(permissions).forEach(key => {
                    permissionsSetToFalse[key] = false;
                });
                setPermissions(permissionsSetToFalse);
                setOpen(false);
            })
            .catch(error => toast.error(error?.message))
            .finally(() => setLoading(false));
    };

    return (
        <Dialog
            size="sm"
            open={open}
            handler={() => setOpen(previousState => !previousState)}
            className="max-h-[95vh]"
        >
            <DialogHeader>
                <Typography variant="h4" color="blue-gray">
                    {member ? _('edit_member') : _('create_member')}
                </Typography>
            </DialogHeader>
            <DialogBody className="max-h-[65vh] overflow-y-auto flex flex-col gap-4">
                <div className="flex items-center justify-center">
                <ButtonGroup>
                    <Button onClick={() => setCurrentTab('member')}>{_('general')}</Button>
                    <Button onClick={() => setCurrentTab('permissions')}>{_('permissions')}</Button>
                    <Button onClick={() => setCurrentTab('coinpacks')}>{_('coinpacks')}</Button>
                </ButtonGroup>
                </div>

                <div className={`flex flex-col gap-4 ${currentTab === 'member' ? 'block' : 'hidden'}`}>
                    <Typography className="-mb-2" variant="h6" color="gray">
                        {_('role')}
                    </Typography>
                    <Input
                        size="lg"
                        label={_('member_role')}
                        autoComplete='off'
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    />
                </div>
                <div className={`flex flex-col gap-4 ${currentTab === 'permissions' ? 'block' : 'hidden'}`}>
                    <Typography className="-mb-2" variant="h6" color="gray">
                        {_('general')}
                    </Typography>
                    <Checkbox
                        label={_('can_see_admin_panel')}
                        checked={permissions.canSeeAdminPanel}
                        onChange={(e) => setPermissions({ ...permissions, canSeeAdminPanel: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_edit_organization')}
                        checked={permissions.canEditOrganization}
                        onChange={(e) => setPermissions({ ...permissions, canEditOrganization: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_delete_organization')}
                        checked={permissions.canDeleteOrganization}
                        onChange={(e) => setPermissions({ ...permissions, canDeleteOrganization: e.target.checked })}
                    />

                    <Typography className="-mb-2" variant="h6" color="gray">
                        {_('members')}
                    </Typography>
                    <Checkbox
                        label={_('can_edit_member')}
                        checked={permissions.canEditMember}
                        onChange={(e) => setPermissions({ ...permissions, canEditMember: e.target.checked })}
                    />
                    <Typography className="-mb-2" variant="h6" color="gray">
                        {_('content')}
                    </Typography>
                    <Checkbox
                        label={_('can_create_author')}
                        checked={permissions.canCreateAuthor}
                        onChange={(e) => setPermissions({ ...permissions, canCreateAuthor: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_create_manga_profile')}
                        checked={permissions.canCreateMangaProfile}
                        onChange={(e) => setPermissions({ ...permissions, canCreateMangaProfile: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_create_manga')}
                        checked={permissions.canCreateMangaCustom}
                        onChange={(e) => setPermissions({ ...permissions, canCreateMangaCustom: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_edit_manga')}
                        checked={permissions.canEditMangaCustom}
                        onChange={(e) => setPermissions({ ...permissions, canEditMangaCustom: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_delete_manga')}
                        checked={permissions.canDeleteMangaCustom}
                        onChange={(e) => setPermissions({ ...permissions, canDeleteMangaCustom: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_create_genre')}
                        checked={permissions.canCreateGenre}
                        onChange={(e) => setPermissions({ ...permissions, canCreateGenre: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_edit_genre')}
                        checked={permissions.canEditGenre}
                        onChange={(e) => setPermissions({ ...permissions, canEditGenre: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_delete_genre')}
                        checked={permissions.canDeleteGenre}
                        onChange={(e) => setPermissions({ ...permissions, canDeleteGenre: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_create_chapter')}
                        checked={permissions.canCreateChapter}
                        onChange={(e) => setPermissions({ ...permissions, canCreateChapter: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_edit_chapter')}
                        checked={permissions.canEditChapter}
                        onChange={(e) => setPermissions({ ...permissions, canEditChapter: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_delete_chapter')}
                        checked={permissions.canDeleteChapter}
                        onChange={(e) => setPermissions({ ...permissions, canDeleteChapter: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_create_page')}
                        checked={permissions.canCreatePage}
                        onChange={(e) => setPermissions({ ...permissions, canCreatePage: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_edit_page')}
                        checked={permissions.canEditPage}
                        onChange={(e) => setPermissions({ ...permissions, canEditPage: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_delete_page')}
                        checked={permissions.canDeletePage}
                        onChange={(e) => setPermissions({ ...permissions, canDeletePage: e.target.checked })}
                    />
                    <Typography className="-mb-2" variant="h6" color="gray">
                        {_('coinpacks')}
                    </Typography>
                    <Checkbox
                        label={_('can_create_coinpack')}
                        checked={permissions.canCreateCoinpack}
                        onChange={(e) => setPermissions({ ...permissions, canCreateCoinpack: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_edit_coinpack')}
                        checked={permissions.canEditCoinpack}
                        onChange={(e) => setPermissions({ ...permissions, canEditCoinpack: e.target.checked })}
                    />
                    <Checkbox
                        label={_('can_delete_coinpack')}
                        checked={permissions.canDeleteCoinpack}
                        onChange={(e) => setPermissions({ ...permissions, canDeleteCoinpack: e.target.checked })}
                    />
                </div>
                <div className={`flex flex-col gap-4 ${currentTab === 'coinpacks' ? 'block' : 'hidden'}`}>
                    <Typography className="-mb-2" variant="h6" color="gray">
                        {_('coinpacks')}
                    </Typography>
                </div>
            </DialogBody>
            <DialogFooter className="space-x-2">
                <Button variant="outlined" onClick={handleSubmit} loading={loading}>
                    {_('save')}
                </Button>
            </DialogFooter>
            <ToastContainer theme="dark" />
        </Dialog>
    );
}
