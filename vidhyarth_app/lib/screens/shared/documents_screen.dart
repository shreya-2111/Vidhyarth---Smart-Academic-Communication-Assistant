import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'dart:io';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../models/document_model.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/loading_widget.dart';

class DocumentsScreen extends StatefulWidget {
  final int userId;
  final String userType;
  const DocumentsScreen({super.key, required this.userId, required this.userType});
  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<DocumentModel> _myDocs = [];
  List<DocumentModel> _publicDocs = [];
  Map<String, dynamic>? _stats;
  String? _filterSubject, _filterCategory, _filterSemester;
  String _searchQuery = '';
  List<String> _subjects = [], _semesters = [], _categories = [];
  bool _loading = true;
  String? _error;
  final TextEditingController _searchController = TextEditingController();

  bool get _isFaculty => widget.userType == 'faculty';

  // Categories will be loaded from backend, but keep defaults as fallback
  static const _defaultCats = ['lecture_notes','slides','assignments','reference','syllabus','other'];
  static const _catLabels = {
    'lecture_notes':'Lecture Notes','slides':'Slides','assignments':'Assignment Materials',
    'reference':'Reference Materials','syllabus':'Syllabus','other':'Other',
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _isFaculty ? 3 : 1, vsync: this);
    _loadAll();
  }

  @override
  void dispose() { 
    _tabController.dispose(); 
    _searchController.dispose();
    super.dispose(); 
  }

  Future<void> _loadAll() async {
    setState(() { _loading = true; _error = null; });
    try {
      if (_isFaculty) {
        final r = await Future.wait([
          apiService.get('/documents/faculty/${widget.userId}') as Future,
          apiService.get('/documents/public') as Future,
          apiService.get('/documents/stats/${widget.userId}'),
          apiService.get('/documents/filters/${widget.userId}'),
          apiService.get('/master/dropdowns'), // Get master data
        ]);
        final filters = r[3] as Map<String, dynamic>;
        final masterData = r[4] as Map<String, dynamic>;
        setState(() {
          _myDocs = (r[0] as List).map((e) => DocumentModel.fromJson(e)).toList();
          _publicDocs = (r[1] as List).map((e) => DocumentModel.fromJson(e)).toList();
          _stats = r[2] as Map<String, dynamic>;
          
          // Load subjects from both filters and master data
          final filterSubjects = (filters['subjects'] as List? ?? []).cast<String>();
          final masterSubjects = ((masterData['subjects'] as List? ?? [])
              .map((s) => s['subject_name'] as String? ?? '')).where((s) => s.isNotEmpty).toList();
          _subjects = [...filterSubjects, ...masterSubjects].toSet().toList()..sort();
          
          // Load semesters from both filters and master data
          final filterSemesters = (filters['semesters'] as List? ?? []).cast<String>();
          final masterSemesters = (masterData['semesters'] as List? ?? []).cast<String>();
          // Only use master data semesters (real database semesters), ignore document semesters
          _semesters = masterSemesters.toSet().toList()..sort();
          
          // Load categories (use default if not provided)
          _categories = (filters['categories'] as List? ?? _defaultCats).cast<String>();
          
          _loading = false;
        });
      } else {
        // For students, load public documents and filters
        final r = await Future.wait([
          apiService.get('/documents/public') as Future,
          apiService.get('/documents/filters/public'), // Get public document filters
          apiService.get('/master/dropdowns'), // Get master data for additional options
        ]);
        final publicFilters = r[1] as Map<String, dynamic>;
        final masterData = r[2] as Map<String, dynamic>;
        setState(() {
          _publicDocs = (r[0] as List).map((e) => DocumentModel.fromJson(e)).toList();
          
          // Combine subjects from public documents and master data
          final publicSubjects = (publicFilters['subjects'] as List? ?? []).cast<String>();
          final masterSubjects = ((masterData['subjects'] as List? ?? [])
              .map((s) => s['subject_name'] as String? ?? '')).where((s) => s.isNotEmpty).toList();
          _subjects = [...publicSubjects, ...masterSubjects].toSet().toList()..sort();
          
          // Combine semesters from public documents and master data
          final publicSemesters = (publicFilters['semesters'] as List? ?? []).cast<String>();
          final masterSemesters = (masterData['semesters'] as List? ?? []).cast<String>();
          // Only use master data semesters (real database semesters), ignore document semesters
          _semesters = masterSemesters.toSet().toList()..sort();
          
          _categories = (publicFilters['categories'] as List? ?? _defaultCats).cast<String>();
          _loading = false;
        });
      }
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _refreshFilters() async {
    try {
      if (_isFaculty) {
        final r = await Future.wait([
          apiService.get('/documents/filters/${widget.userId}'),
          apiService.get('/master/dropdowns'),
        ]);
        final filters = r[0] as Map<String, dynamic>;
        final masterData = r[1] as Map<String, dynamic>;
        
        final filterSubjects = (filters['subjects'] as List? ?? []).cast<String>();
        final masterSubjects = ((masterData['subjects'] as List? ?? [])
            .map((s) => s['subject_name'] as String? ?? '')).where((s) => s.isNotEmpty).toList();
        _subjects = [...filterSubjects, ...masterSubjects].toSet().toList()..sort();
        
        final filterSemesters = (filters['semesters'] as List? ?? []).cast<String>();
        final masterSemesters = (masterData['semesters'] as List? ?? []).cast<String>();
        // Only use master data semesters (real database semesters)
        _semesters = masterSemesters.toSet().toList()..sort();
        
        _categories = (filters['categories'] as List? ?? _defaultCats).cast<String>();
      } else {
        final r = await Future.wait([
          apiService.get('/documents/filters/public'),
          apiService.get('/master/dropdowns'),
        ]);
        final publicFilters = r[0] as Map<String, dynamic>;
        final masterData = r[1] as Map<String, dynamic>;
        
        final publicSubjects = (publicFilters['subjects'] as List? ?? []).cast<String>();
        final masterSubjects = ((masterData['subjects'] as List? ?? [])
            .map((s) => s['subject_name'] as String? ?? '')).where((s) => s.isNotEmpty).toList();
        _subjects = [...publicSubjects, ...masterSubjects].toSet().toList()..sort();
        
        final publicSemesters = (publicFilters['semesters'] as List? ?? []).cast<String>();
        final masterSemesters = (masterData['semesters'] as List? ?? []).cast<String>();
        // Only use master data semesters (real database semesters)
        _semesters = masterSemesters.toSet().toList()..sort();
        
        _categories = (publicFilters['categories'] as List? ?? _defaultCats).cast<String>();
      }
      setState(() {});
    } catch (e) {
      // Silently handle filter refresh errors
      print('Error refreshing filters: $e');
    }
  }

  List<DocumentModel> _filtered(List<DocumentModel> docs) => docs.where((d) {
    // Search filter
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      final titleMatch = d.title.toLowerCase().contains(query);
      final subjectMatch = (d.subject ?? '').toLowerCase().contains(query);
      final descMatch = (d.description ?? '').toLowerCase().contains(query);
      if (!titleMatch && !subjectMatch && !descMatch) return false;
    }
    
    // Other filters
    if (_filterSubject != null && d.subject != _filterSubject) return false;
    if (_filterCategory != null && d.category != _filterCategory) return false;
    if (_filterSemester != null && d.semester != _filterSemester) return false;
    return true;
  }).toList();

  void _showUploadDialog() async {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final subjectCtrl = TextEditingController();
    final semCtrl = TextEditingController();
    String selCat = _categories.isNotEmpty ? _categories.first : 'lecture_notes';
    bool isPublic = true;
    File? file;
    String? fileName;
    bool uploading = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(builder: (ctx, setS) => AlertDialog(
        title: const Row(children: [
          Icon(Icons.upload_file, color: AppTheme.primary, size: 20),
          SizedBox(width: 8),
          Text('Upload Document', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
        ]),
        content: SingleChildScrollView(child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _lbl('Title *'),
            TextFormField(controller: titleCtrl, decoration: _dec('Document title')),
            const SizedBox(height: 10),
            _lbl('Description'),
            TextFormField(controller: descCtrl, maxLines: 3, decoration: _dec('Brief description of the document')),
            const SizedBox(height: 10),
            Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _lbl('Subject'),
                DropdownButtonFormField<String>(
                  value: subjectCtrl.text.isEmpty ? null : subjectCtrl.text,
                  decoration: _dec('Select Subject'),
                  isExpanded: true,
                  items: [
                    const DropdownMenuItem<String>(value: null, child: Text('Select Subject', style: TextStyle(fontSize: 12))),
                    ..._subjects.map((s) => DropdownMenuItem<String>(
                      value: s, 
                      child: Text(s, style: const TextStyle(fontSize: 12), overflow: TextOverflow.ellipsis)
                    ))
                  ],
                  onChanged: (v) => setS(() => subjectCtrl.text = v ?? ''),
                ),
              ])),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _lbl('Semester'),
                DropdownButtonFormField<String>(
                  value: semCtrl.text.isEmpty ? null : semCtrl.text,
                  decoration: _dec('Select Semester'),
                  isExpanded: true,
                  items: [
                    const DropdownMenuItem<String>(value: null, child: Text('Select Semester', style: TextStyle(fontSize: 12))),
                    ..._semesters.map((s) => DropdownMenuItem<String>(
                      value: s, 
                      child: Text(s, style: const TextStyle(fontSize: 12), overflow: TextOverflow.ellipsis)
                    ))
                  ],
                  onChanged: (v) => setS(() => semCtrl.text = v ?? ''),
                ),
              ])),
            ]),
            const SizedBox(height: 10),
            Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _lbl('Category *'),
                DropdownButtonFormField<String>(
                  value: selCat, 
                  decoration: _dec(''),
                  isExpanded: true,
                  items: _categories.map((c) => DropdownMenuItem(
                    value: c,
                    child: Text(_catLabels[c] ?? c, style: const TextStyle(fontSize: 12), overflow: TextOverflow.ellipsis)
                  )).toList(),
                  onChanged: (v) => setS(() => selCat = v!),
                ),
              ])),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _lbl('Visibility'),
                DropdownButtonFormField<bool>(
                  value: isPublic, 
                  decoration: _dec(''),
                  isExpanded: true,
                  items: const [
                    DropdownMenuItem(value: true, child: Text('🌐 Public (Students)', style: TextStyle(fontSize: 11))),
                    DropdownMenuItem(value: false, child: Text('🔒 Private', style: TextStyle(fontSize: 12))),
                  ],
                  onChanged: (v) => setS(() => isPublic = v!),
                ),
              ])),
            ]),
            const SizedBox(height: 10),
            _lbl('File *'),
            if (fileName != null)
              Container(
                padding: const EdgeInsets.all(8),
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(color: const Color(0xFFE8F5E9),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.green.shade300)),
                child: Row(children: [
                  const Icon(Icons.insert_drive_file, color: Colors.green, size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text(fileName!, style: const TextStyle(fontSize: 12), overflow: TextOverflow.ellipsis)),
                  GestureDetector(onTap: () => setS(() { file = null; fileName = null; }),
                      child: const Icon(Icons.close, size: 16, color: Colors.grey)),
                ]),
              ),
            SizedBox(width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () async {
                  final r = await FilePicker.platform.pickFiles();
                  if (r != null && r.files.single.path != null) {
                    setS(() { file = File(r.files.single.path!); fileName = r.files.single.name; });
                  }
                },
                icon: const Icon(Icons.attach_file, size: 16),
                label: const Text('Choose File', style: TextStyle(fontSize: 13)),
                style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 10)),
              ),
            ),
            const SizedBox(height: 4),
            const Text('Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, Images (Max 50MB)',
                style: TextStyle(fontSize: 10, color: Colors.grey)),
          ],
        )),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            onPressed: uploading ? null : () async {
              if (titleCtrl.text.trim().isEmpty || file == null) {
                ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Title and file are required')));
                return;
              }
              setS(() => uploading = true);
              try {
                await apiService.uploadFile('/documents/upload', file!, 'document', fields: {
                  'title': titleCtrl.text.trim(),
                  'description': descCtrl.text.trim(),
                  'subject': subjectCtrl.text.trim(),
                  'semester': semCtrl.text.trim(),
                  'category': selCat,
                  'isPublic': isPublic.toString(),
                });
                if (mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text('Document uploaded successfully'), backgroundColor: AppTheme.success));
                }
                _loadAll();
                _refreshFilters(); // Refresh filters after upload
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
              } finally { setS(() => uploading = false); }
            },
            child: uploading
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Upload Document', style: TextStyle(color: Colors.white)),
          ),
        ],
      )),
    );
  }

  void _showEditDialog(DocumentModel doc) {
    final titleCtrl = TextEditingController(text: doc.title);
    final descCtrl = TextEditingController(text: doc.description ?? '');
    final subjectCtrl = TextEditingController(text: doc.subject ?? '');
    final semCtrl = TextEditingController(text: doc.semester ?? '');
    String selCat = _categories.contains(doc.category) ? doc.category! : (_categories.isNotEmpty ? _categories.first : 'other');
    bool isPublic = doc.isPublic;
    bool saving = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(builder: (ctx, setS) => AlertDialog(
        title: const Row(children: [
          Icon(Icons.edit, color: Color(0xFFE65100), size: 20),
          SizedBox(width: 8),
          Text('Edit Document', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
        ]),
        content: SingleChildScrollView(child: Column(
          mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _lbl('Title *'),
            TextFormField(controller: titleCtrl, decoration: _dec('Document title')),
            const SizedBox(height: 10),
            _lbl('Description'),
            TextFormField(controller: descCtrl, maxLines: 3, decoration: _dec('Description')),
            const SizedBox(height: 10),
            Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _lbl('Subject'),
                DropdownButtonFormField<String>(
                  value: subjectCtrl.text.isEmpty ? null : subjectCtrl.text,
                  decoration: _dec('Select Subject'),
                  isExpanded: true,
                  items: [
                    const DropdownMenuItem<String>(value: null, child: Text('Select Subject', style: TextStyle(fontSize: 12))),
                    ..._subjects.map((s) => DropdownMenuItem<String>(
                      value: s, 
                      child: Text(s, style: const TextStyle(fontSize: 12), overflow: TextOverflow.ellipsis)
                    ))
                  ],
                  onChanged: (v) => setS(() => subjectCtrl.text = v ?? ''),
                ),
              ])),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _lbl('Semester'),
                DropdownButtonFormField<String>(
                  value: semCtrl.text.isEmpty ? null : semCtrl.text,
                  decoration: _dec('Select Semester'),
                  isExpanded: true,
                  items: [
                    const DropdownMenuItem<String>(value: null, child: Text('Select Semester', style: TextStyle(fontSize: 12))),
                    ..._semesters.map((s) => DropdownMenuItem<String>(
                      value: s, 
                      child: Text(s, style: const TextStyle(fontSize: 12), overflow: TextOverflow.ellipsis)
                    ))
                  ],
                  onChanged: (v) => setS(() => semCtrl.text = v ?? ''),
                ),
              ])),
            ]),
            const SizedBox(height: 10),
            Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _lbl('Category'),
                DropdownButtonFormField<String>(
                  value: selCat, 
                  decoration: _dec(''),
                  isExpanded: true,
                  items: _categories.map((c) => DropdownMenuItem(
                    value: c,
                    child: Text(_catLabels[c] ?? c, style: const TextStyle(fontSize: 12), overflow: TextOverflow.ellipsis)
                  )).toList(),
                  onChanged: (v) => setS(() => selCat = v!),
                ),
              ])),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _lbl('Visibility'),
                DropdownButtonFormField<bool>(
                  value: isPublic, 
                  decoration: _dec(''),
                  isExpanded: true,
                  items: const [
                    DropdownMenuItem(value: true, child: Text('🌐 Public', style: TextStyle(fontSize: 12))),
                    DropdownMenuItem(value: false, child: Text('🔒 Private', style: TextStyle(fontSize: 12))),
                  ],
                  onChanged: (v) => setS(() => isPublic = v!),
                ),
              ])),
            ]),
          ],
        )),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            onPressed: saving ? null : () async {
              setS(() => saving = true);
              try {
                await apiService.put('/documents/${doc.documentId}', {
                  'title': titleCtrl.text.trim(),
                  'description': descCtrl.text.trim(),
                  'subject': subjectCtrl.text.trim(),
                  'semester': semCtrl.text.trim(),
                  'category': selCat,
                  'isPublic': isPublic,
                });
                if (mounted) Navigator.pop(ctx);
                _loadAll();
                _refreshFilters(); // Refresh filters after edit
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
              } finally { setS(() => saving = false); }
            },
            child: saving
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Save Changes', style: TextStyle(color: Colors.white)),
          ),
        ],
      )),
    );
  }

  Future<void> _download(DocumentModel doc) async {
    final token = authService.token ?? '';
    final uri = Uri.parse('${AppConstants.baseUrl}/documents/download/${doc.documentId}')
        .replace(queryParameters: {'token': token});
        
    final originalFileName = (doc.fileName.isNotEmpty) ? doc.fileName : 'document_${doc.documentId}.pdf';
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final nameWithoutExt = originalFileName.split('.').first;
    final ext = originalFileName.contains('.') ? '.${originalFileName.split('.').last}' : '';
    final fileName = '${nameWithoutExt}_$timestamp$ext';
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Downloading...')),
      );
    }
    
    try {
      final response = await http.get(
        uri,
        headers: {'Authorization': 'Bearer $token'},
      );
      
      if (response.statusCode == 200) {
        final file = File('/storage/emulated/0/Download/$fileName');
        await file.writeAsBytes(response.bodyBytes);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Downloaded to Downloads/$fileName'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to download: Server returned ${response.statusCode}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Download failed: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _delete(DocumentModel doc) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Document'),
        content: Text('Delete "${doc.title}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (ok == true) { 
      await apiService.delete('/documents/${doc.documentId}'); 
      _loadAll(); 
      _refreshFilters(); // Refresh filters after delete
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingWidget();
    if (_error != null) return AppErrorWidget(message: _error!, onRetry: _loadAll);
    
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      floatingActionButton: _isFaculty
          ? FloatingActionButton.extended(
              onPressed: _showUploadDialog,
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.upload_file, size: 18),
              label: const Text('Upload Document', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            )
          : null,
      body: Column(children: [
        // Header
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
          child: Column(children: [
            const Align(alignment: Alignment.centerLeft,
                child: Text('📚 Study Resources', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
            const SizedBox(height: 16),
            
            // Search Bar
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (value) => setState(() => _searchQuery = value),
                decoration: InputDecoration(
                  hintText: 'Search resources by title, subject, or description',
                  hintStyle: const TextStyle(color: Colors.grey, fontSize: 14),
                  prefixIcon: const Icon(Icons.search, color: Colors.grey),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
              ),
            ),
            const SizedBox(height: 12),
            
            // Category Filter
            Row(children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _filterCategory,
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  isExpanded: true,
                  items: [
                    const DropdownMenuItem<String>(
                      value: null,
                      child: Text('All Resources', style: TextStyle(fontSize: 14)),
                    ),
                    ..._categories.map((c) => DropdownMenuItem<String>(
                      value: c,
                      child: Text(_catLabels[c] ?? c, style: const TextStyle(fontSize: 14)),
                    ))
                  ],
                  onChanged: (v) => setState(() => _filterCategory = v),
                ),
              ),
            ]),
            
            // Tabs (only for faculty)
            if (_isFaculty) ...[
              const SizedBox(height: 10),
              TabBar(
                controller: _tabController,
                labelColor: AppTheme.primary,
                unselectedLabelColor: Colors.grey,
                indicatorColor: AppTheme.primary,
                tabs: const [
                  Tab(text: '📄 My Documents'), 
                  Tab(text: '🌐 Public Documents'), 
                  Tab(text: '📊 Statistics')
                ],
              ),
            ],
            const SizedBox(height: 8),
          ]),
        ),
        
        // Content
        Expanded(
          child: _isFaculty 
            ? TabBarView(
                controller: _tabController,
                children: [
                  _buildList(_filtered(_myDocs), true), 
                  _buildList(_filtered(_publicDocs), false), 
                  _buildStats()
                ],
              )
            : _buildList(_filtered(_publicDocs), false),
        ),
      ]),
    );
  }

  Widget _buildList(List<DocumentModel> docs, bool showActions) {
    if (docs.isEmpty) {
      return const EmptyStateWidget(
        message: 'No documents found', 
        icon: Icons.folder_open
      );
    }
    
    return RefreshIndicator(
      onRefresh: _loadAll,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        itemCount: docs.length,
        itemBuilder: (_, i) {
          final d = docs[i];
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05), 
                  blurRadius: 8,
                  offset: const Offset(0, 2)
                )
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header with file icon and title
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        _fileIcon(d.fileType), 
                        color: AppTheme.primary, 
                        size: 24
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            d.title,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold, 
                              fontSize: 16,
                              color: Colors.black87,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (d.description != null && d.description!.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              d.description!,
                              style: TextStyle(
                                fontSize: 13, 
                                color: Colors.grey.shade600
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 12),
                
                // Metadata chips
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    if (d.subject != null && d.subject!.isNotEmpty)
                      _MetaChip(d.subject!, AppTheme.primary),
                    if (d.category != null)
                      _MetaChip(_catLabels[d.category] ?? d.category!, Colors.green),
                    if (d.semester != null && d.semester!.isNotEmpty)
                      _MetaChip(d.semester!, Colors.purple),
                    _MetaChip(d.fileName.split('.').last.toUpperCase(), Colors.orange),
                    _MetaChip(d.fileSizeFormatted, Colors.grey),
                  ],
                ),
                
                const SizedBox(height: 12),
                
                // Footer with faculty info and date
                Row(
                  children: [
                    if (d.facultyName != null) ...[
                      Icon(Icons.person, size: 14, color: Colors.grey.shade600),
                      const SizedBox(width: 4),
                      Text(
                        'By ${d.facultyName}',
                        style: TextStyle(
                          fontSize: 12, 
                          color: Colors.grey.shade600
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    Icon(Icons.download, size: 14, color: Colors.grey.shade600),
                    const SizedBox(width: 4),
                    Text(
                      '${d.downloadCount} downloads',
                      style: TextStyle(
                        fontSize: 12, 
                        color: Colors.grey.shade600
                      ),
                    ),
                    const Spacer(),
                    Text(
                      DateFormat('d MMM yyyy').format(
                        DateTime.tryParse(d.createdAt) ?? DateTime.now()
                      ),
                      style: TextStyle(
                        fontSize: 12, 
                        color: Colors.grey.shade600
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // Action buttons
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _download(d),
                        icon: const Icon(Icons.download, size: 16),
                        label: const Text('Download'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                    if (showActions) ...[
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: () => _showEditDialog(d),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.orange,
                          side: const BorderSide(color: Colors.orange),
                          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Icon(Icons.edit, size: 16),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: () => _delete(d),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                          side: const BorderSide(color: Colors.red),
                          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Icon(Icons.delete, size: 16),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStats() {
    if (_stats == null) return const EmptyStateWidget(message: 'No statistics available');
    return ListView(
      padding: const EdgeInsets.all(14),
      children: [
        GridView.count(
          crossAxisCount: 2, shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 2.2,
          children: [
            _StatBox('Total Documents', '${_stats!['totalDocuments'] ?? 0}', Icons.folder, AppTheme.primary),
            _StatBox('Total Downloads', '${_stats!['totalDownloads'] ?? 0}', Icons.download, AppTheme.success),
          ],
        ),
        const SizedBox(height: 14),
        if ((_stats!['categoryStats'] as List? ?? []).isNotEmpty) ...[
          const Text('By Category', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ...(_stats!['categoryStats'] as List).map((c) => ListTile(
            dense: true,
            leading: const Icon(Icons.folder, color: AppTheme.primary, size: 18),
            title: Text(_catLabels[c['category']] ?? c['category'] ?? '', style: const TextStyle(fontSize: 13)),
            trailing: Text('${c['count']}', style: const TextStyle(fontWeight: FontWeight.bold)),
          )),
        ],
      ],
    );
  }

  IconData _fileIcon(String t) {
    if (t.contains('pdf')) return Icons.picture_as_pdf;
    if (t.contains('image')) return Icons.image;
    if (t.contains('word') || t.contains('document')) return Icons.description;
    if (t.contains('presentation')) return Icons.slideshow;
    return Icons.insert_drive_file;
  }
}

class _MetaChip extends StatelessWidget {
  final String label;
  final Color color;
  const _MetaChip(this.label, this.color);
  
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(6),
      border: Border.all(color: color.withValues(alpha: 0.3)),
    ),
    child: Text(
      label, 
      style: TextStyle(
        fontSize: 11, 
        color: color, 
        fontWeight: FontWeight.w600
      )
    ),
  );
}

class _StatBox extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const _StatBox(this.label, this.value, this.icon, this.color);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Colors.white, borderRadius: BorderRadius.circular(10),
      border: Border.all(color: color.withValues(alpha: 0.3)),
    ),
    child: Row(children: [
      Icon(icon, color: color, size: 28),
      const SizedBox(width: 12),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
      ]),
    ]),
  );
}

Widget _lbl(String t) => Padding(
  padding: const EdgeInsets.only(bottom: 4),
  child: Text(t, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87)),
);

InputDecoration _dec(String hint) => InputDecoration(
  hintText: hint,
  hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
  filled: true, fillColor: const Color(0xFFF5F5F5), isDense: true,
  contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.primary)),
);
