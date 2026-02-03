import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { Folder, FolderPlus, FolderOpen, Upload, Edit2, Trash2, Users, FileSpreadsheet, ChevronRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminFolderManagement = () => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderDetails, setFolderDetails] = useState(null);
  
  // Dialog states
  const [createDeptDialogOpen, setCreateDeptDialogOpen] = useState(false);
  const [createYearDialogOpen, setCreateYearDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Form states
  const [newDeptName, setNewDeptName] = useState('');
  const [newYearName, setNewYearName] = useState('');
  const [renameName, setRenameName] = useState('');
  const [parentDeptId, setParentDeptId] = useState('');
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [uploadYearFolderId, setUploadYearFolderId] = useState('');

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/folders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFolders(response.data);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderDetails = async (folderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/folders/${folderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFolderDetails(response.data);
      setSelectedFolder(folderId);
    } catch (error) {
      console.error('Failed to fetch folder details:', error);
      toast.error('Failed to load folder details');
    }
  };

  const createDepartment = async () => {
    if (!newDeptName.trim()) {
      toast.error('Please enter a department name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/folders`, {
        name: newDeptName,
        type: 'department'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Department folder created');
      setNewDeptName('');
      setCreateDeptDialogOpen(false);
      fetchFolders();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to create department';
      toast.error(message);
    }
  };

  const createYearFolder = async () => {
    if (!newYearName.trim() || !parentDeptId) {
      toast.error('Please select a department and enter year');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/folders`, {
        name: newYearName,
        type: 'year',
        parent_id: parentDeptId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Year folder created');
      setNewYearName('');
      setParentDeptId('');
      setCreateYearDialogOpen(false);
      fetchFolders();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to create year folder';
      toast.error(message);
    }
  };

  const renameFolder = async () => {
    if (!renameName.trim() || !folderDetails) {
      toast.error('Please enter a new name');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API}/folders/${folderDetails.id}`, {
        name: renameName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.students_updated) {
        toast.success(`Folder renamed and ${response.data.students_updated} students updated`);
      } else {
        toast.success('Folder renamed successfully');
      }
      
      setRenameDialogOpen(false);
      setRenameName('');
      fetchFolders();
      if (folderDetails) {
        fetchFolderDetails(folderDetails.id);
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to rename folder';
      toast.error(message);
    }
  };

  const deleteFolder = async () => {
    if (!folderToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/folders/${folderToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Folder deleted successfully');
      setDeleteDialogOpen(false);
      setFolderToDelete(null);
      setFolderDetails(null);
      setSelectedFolder(null);
      fetchFolders();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to delete folder';
      toast.error(message);
    }
  };

  const uploadExcel = async () => {
    if (!excelFile || !uploadYearFolderId) {
      toast.error('Please select a year folder and Excel file');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', excelFile);

      const response = await axios.post(`${API}/folders/${uploadYearFolderId}/upload-excel`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(response.data.message);
      setExcelFile(null);
      setUploadDialogOpen(false);
      if (selectedFolder) {
        fetchFolderDetails(selectedFolder);
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to upload Excel';
      toast.error(message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-outfit">Folder Management</h1>
          <p className="text-slate-600 mt-1">Organize students by department and year</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={createDeptDialogOpen} onOpenChange={setCreateDeptDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="w-4 h-4 mr-2" />
                New Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Department Folder</DialogTitle>
                <DialogDescription>
                  Add a new department folder (e.g., CSE, IT, ECE)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Department Name</Label>
                  <Input
                    placeholder="e.g., CSE, IT, ECE"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createDepartment}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Folders List */}
        <Card>
          <CardHeader>
            <CardTitle>Department Folders</CardTitle>
            <CardDescription>Click on a year folder to view students</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="spinner" />
              </div>
            ) : folders.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No departments yet. Create one to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {folders.map((dept) => (
                  <div key={dept.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Folder className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-slate-900">{dept.name}</span>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setParentDeptId(dept.id)}
                          >
                            <FolderPlus className="w-4 h-4 mr-1" />
                            Add Year
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create Year Folder in {dept.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Year</Label>
                              <Input
                                placeholder="e.g., 1, 2, 3, 4"
                                value={newYearName}
                                onChange={(e) => setNewYearName(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={createYearFolder}>Create</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    {dept.years && dept.years.length > 0 ? (
                      <div className="space-y-2 pl-4">
                        {dept.years.map((year) => (
                          <div
                            key={year.id}
                            className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition ${
                              selectedFolder === year.id
                                ? 'bg-blue-50 border-2 border-blue-200'
                                : 'bg-slate-50 hover:bg-slate-100'
                            }`}
                            onClick={() => fetchFolderDetails(year.id)}
                          >
                            <div className="flex items-center gap-2">
                              <FolderOpen className="w-4 h-4 text-slate-600" />
                              <span className="text-sm font-medium">Year {year.name}</span>
                              <span className="text-xs text-slate-500">
                                ({year.student_count || 0} students)
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 pl-4">No year folders yet</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Folder Details */}
        <Card>
          <CardHeader>
            <CardTitle>Folder Details</CardTitle>
            <CardDescription>
              {folderDetails ? `Year ${folderDetails.name}` : 'Select a year folder to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {folderDetails ? (
              <div className="space-y-4">
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setUploadYearFolderId(folderDetails.id);
                          setUploadDialogOpen(true);
                        }}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Upload Excel
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Excel to Year {folderDetails.name}</DialogTitle>
                        <DialogDescription>
                          Students will automatically be assigned to this department and year
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Excel File</Label>
                          <Input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={(e) => setExcelFile(e.target.files[0])}
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Required columns: Roll Number, Full Name, DOB, Email, Phone Number
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={uploadExcel}>Upload</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setRenameName(folderDetails.name)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Rename
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rename Year Folder</DialogTitle>
                        <DialogDescription>
                          This will automatically update all students in this folder
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>New Year</Label>
                          <Input
                            placeholder="e.g., 2, 3, 4"
                            value={renameName}
                            onChange={(e) => setRenameName(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={renameFolder}>Rename</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => {
                      setFolderToDelete(folderDetails);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>

                {/* Student Count */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">Students: {folderDetails.student_count || 0}</span>
                  </div>
                </div>

                {/* Upload History */}
                {folderDetails.uploads && folderDetails.uploads.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      Upload History
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {folderDetails.uploads.map((upload) => (
                        <div key={upload.id} className="bg-slate-50 rounded p-3 text-sm">
                          <div className="font-medium">{upload.filename}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Added: {upload.students_added} | Skipped: {upload.students_skipped}
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(upload.uploaded_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                Select a year folder to view details and manage students
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the folder. This action cannot be undone.
              {folderToDelete?.type === 'year' && folderToDelete?.student_count > 0 && (
                <span className="text-red-600 font-semibold block mt-2">
                  Warning: This folder contains {folderToDelete.student_count} students!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteFolder} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminFolderManagement;
