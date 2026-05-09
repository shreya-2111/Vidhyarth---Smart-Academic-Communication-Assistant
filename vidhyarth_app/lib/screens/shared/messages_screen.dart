import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../services/api_service.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/loading_widget.dart';

class MessagesScreen extends StatefulWidget {
  final int userId;
  final String userType;
  const MessagesScreen(
      {super.key, required this.userId, required this.userType});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _inbox = [];
  List<Map<String, dynamic>> _sent = [];
  bool _loading = true;
  String? _error;

  bool get _isFaculty => widget.userType == 'faculty';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final inbox = await apiService
          .get('/messages/inbox/${widget.userId}/${widget.userType}') as List;
      final sent = await apiService
          .get('/messages/sent/${widget.userId}/${widget.userType}') as List;
      setState(() {
        _inbox = inbox.cast<Map<String, dynamic>>();
        _sent = sent.cast<Map<String, dynamic>>();
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  // ── New Message Dialog for Students ──────────────────
  void _showNewMessageToFaculty() async {
    List<Map<String, dynamic>> faculty = [];
    try {
      final d = await apiService.get('/messages/faculty') as List;
      faculty = d.cast<Map<String, dynamic>>();
    } catch (_) {}
    if (!mounted) return;

    Map<String, dynamic>? selected;
    final msgCtrl = TextEditingController();
    bool sending = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Row(children: [
            Text('✉️ ', style: TextStyle(fontSize: 16)),
            Text('Send Message to Faculty',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ]),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _lbl('To Faculty *'),
              DropdownButtonFormField<Map<String, dynamic>>(
                value: selected,
                decoration: _dec('Select Faculty'),
                isExpanded: true,
                items: faculty.map((f) => DropdownMenuItem(
                  value: f,
                  child: Row(children: [
                    CircleAvatar(
                      radius: 12,
                      backgroundColor: const Color(0xFF388E3C).withValues(alpha: 0.15),
                      child: Text(
                        (f['name'] as String? ?? 'F')[0].toUpperCase(),
                        style: const TextStyle(fontSize: 10, color: Color(0xFF388E3C), fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(child: Text(f['name'] ?? '',
                        style: const TextStyle(fontSize: 13),
                        overflow: TextOverflow.ellipsis)),
                  ]),
                )).toList(),
                onChanged: (v) => setS(() => selected = v),
              ),
              const SizedBox(height: 14),
              _lbl('Message *'),
              TextFormField(
                controller: msgCtrl,
                maxLines: 4,
                decoration: _dec('Type your message here...'),
              ),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
              onPressed: sending ? null : () async {
                if (selected == null || msgCtrl.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Select faculty and enter message')));
                  return;
                }
                setS(() => sending = true);
                try {
                  await apiService.post('/messages/send', {
                    'senderId': widget.userId,
                    'senderType': widget.userType,
                    'receiverId': selected!['faculty_id'],
                    'receiverType': 'faculty',
                    'message': msgCtrl.text.trim(),
                  });
                  if (mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                        content: Text('Message sent to faculty'), backgroundColor: AppTheme.success));
                  }
                  _load();
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
                } finally {
                  setS(() => sending = false);
                }
              },
              child: sending
                  ? const SizedBox(width: 18, height: 18,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Send Message', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
  void _showNewMessage() async {
    List<Map<String, dynamic>> students = [];
    try {
      final d = await apiService.get('/messages/students') as List;
      students = d.cast<Map<String, dynamic>>();
    } catch (_) {}
    if (!mounted) return;

    Map<String, dynamic>? selected;
    final msgCtrl = TextEditingController();
    bool sending = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Row(children: [
            Text('✉️ ', style: TextStyle(fontSize: 16)),
            Text('New Message',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ]),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _lbl('To (Student) *'),
              DropdownButtonFormField<Map<String, dynamic>>(
                value: selected,
                decoration: _dec('Select Student'),
                isExpanded: true,
                items: students.map((s) => DropdownMenuItem(
                  value: s,
                  child: Row(children: [
                    CircleAvatar(
                      radius: 12,
                      backgroundColor: AppTheme.primary.withValues(alpha: 0.15),
                      child: Text(
                        (s['name'] as String? ?? 'S')[0].toUpperCase(),
                        style: const TextStyle(fontSize: 10, color: AppTheme.primary, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(child: Text(s['name'] ?? '',
                        style: const TextStyle(fontSize: 13),
                        overflow: TextOverflow.ellipsis)),
                  ]),
                )).toList(),
                onChanged: (v) => setS(() => selected = v),
              ),
              const SizedBox(height: 14),
              _lbl('Message *'),
              TextFormField(
                controller: msgCtrl,
                maxLines: 4,
                decoration: _dec('Type your message here...'),
              ),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
              onPressed: sending ? null : () async {
                if (selected == null || msgCtrl.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Select student and enter message')));
                  return;
                }
                setS(() => sending = true);
                try {
                  await apiService.post('/messages/send', {
                    'senderId': widget.userId,
                    'senderType': widget.userType,
                    'receiverId': selected!['student_id'],
                    'receiverType': 'student',
                    'message': msgCtrl.text.trim(),
                  });
                  if (mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                        content: Text('Message sent'), backgroundColor: AppTheme.success));
                  }
                  _load();
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
                } finally {
                  setS(() => sending = false);
                }
              },
              child: sending
                  ? const SizedBox(width: 18, height: 18,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Send Message', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  // ── Send Announcement Dialog ──────────────────────────
  void _showAnnouncement() async {
    // Load classes for "Send To" dropdown
    List<Map<String, dynamic>> classes = [];
    try {
      final d = await apiService.get('/attendance/faculty/classes') as List;
      final seen = <String>{};
      classes = d.cast<Map<String, dynamic>>()
          .where((c) => seen.add('${c['class_name']}-${c['semester']}'))
          .toList();
    } catch (_) {}
    if (!mounted) return;

    final titleCtrl = TextEditingController();
    final msgCtrl = TextEditingController();
    // Options: All Students + each class
    String? selectedTarget = 'all'; // 'all' or class display_name
    bool sending = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Row(children: [
            Text('📢 ', style: TextStyle(fontSize: 16)),
            Text('Send Announcement',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ]),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _lbl('Title *'),
                TextFormField(
                  controller: titleCtrl,
                  decoration: _dec('Announcement title'),
                ),
                const SizedBox(height: 14),
                _lbl('Send To *'),
                DropdownButtonFormField<String>(
                  value: selectedTarget,
                  decoration: _dec('Select target'),
                  isExpanded: true,
                  items: [
                    const DropdownMenuItem(
                      value: 'all',
                      child: Text('All Students (Msc.IT)',
                          style: TextStyle(fontSize: 13)),
                    ),
                    ...classes.map((c) => DropdownMenuItem(
                      value: '${c['class_name']}||${c['semester']}',
                      child: Text(
                        '${c['class_name']} - ${c['semester']}',
                        style: const TextStyle(fontSize: 13),
                        overflow: TextOverflow.ellipsis,
                      ),
                    )),
                  ],
                  onChanged: (v) => setS(() => selectedTarget = v),
                ),
                const SizedBox(height: 14),
                _lbl('Message *'),
                TextFormField(
                  controller: msgCtrl,
                  maxLines: 4,
                  decoration: _dec('Type your announcement here...'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFE91E8C)),
              onPressed: sending ? null : () async {
                if (titleCtrl.text.trim().isEmpty || msgCtrl.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Fill title and message')));
                  return;
                }
                setS(() => sending = true);
                try {
                  String targetType = 'all';
                  String? targetValue;
                  if (selectedTarget != 'all') {
                    final parts = selectedTarget!.split('||');
                    targetType = 'class';
                    targetValue = parts[0]; // class_name
                  }
                  await apiService.post('/messages/announcement', {
                    'facultyId': widget.userId,
                    'title': titleCtrl.text.trim(),
                    'message': msgCtrl.text.trim(),
                    'targetType': targetType,
                    'targetValue': targetValue,
                  });
                  if (mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                        content: Text('Announcement sent'), backgroundColor: AppTheme.success));
                  }
                  _load();
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
                } finally {
                  setS(() => sending = false);
                }
              },
              child: sending
                  ? const SizedBox(width: 18, height: 18,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Send Announcement', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  // ── Message detail dialog ─────────────────────────────
  void _openMessage(Map<String, dynamic> m, bool isInbox) async {
    if (isInbox && m['is_read'] == 0) {
      await apiService.put('/messages/read/${m['message_id']}', {});
      _load();
    }
    if (!mounted) return;
    final name = isInbox
        ? (m['sender_name'] ?? 'Unknown')
        : (m['receiver_name'] ?? 'Unknown');
    final role = isInbox ? m['sender_type'] : m['receiver_type'];
    final date = _fmtDate(m['created_at']);

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Row(children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
            child: Text(
              (name as String).isNotEmpty ? name[0].toUpperCase() : '?',
              style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
              Text(
                '${(role as String? ?? '').toUpperCase()} • $date',
                style: const TextStyle(fontSize: 10, color: Colors.grey),
              ),
            ],
          )),
        ]),
        content: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF5F5F5),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(m['message'] ?? '', style: const TextStyle(fontSize: 13)),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close')),
          if (isInbox && (_isFaculty || (!_isFaculty && m['sender_type'] == 'faculty')))
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
              onPressed: () {
                Navigator.pop(context);
                _replyTo(m);
              },
              child: const Text('Reply', style: TextStyle(color: Colors.white)),
            ),
        ],
      ),
    );
  }

  void _replyTo(Map<String, dynamic> m) async {
    final msgCtrl = TextEditingController();
    bool sending = false;
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: Text('Reply to ${m['sender_name'] ?? ''}',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          content: TextFormField(
            controller: msgCtrl,
            maxLines: 4,
            decoration: _dec('Type your reply...'),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
              onPressed: sending ? null : () async {
                if (msgCtrl.text.trim().isEmpty) return;
                setS(() => sending = true);
                try {
                  await apiService.post('/messages/send', {
                    'senderId': widget.userId,
                    'senderType': widget.userType,
                    'receiverId': m['sender_id'],
                    'receiverType': m['sender_type'],
                    'message': msgCtrl.text.trim(),
                  });
                  if (mounted) Navigator.pop(ctx);
                  _load();
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(e.toString())));
                } finally {
                  setS(() => sending = false);
                }
              },
              child: const Text('Send Reply', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  String _fmtDate(dynamic d) {
    if (d == null) return '';
    try {
      return DateFormat('d/M/yyyy').format(DateTime.parse(d.toString()));
    } catch (_) { return d.toString(); }
  }

  Color _avatarColor(String name) {
    const colors = [Color(0xFF1976D2), Color(0xFF388E3C), Color(0xFF7B1FA2),
      Color(0xFFF57C00), Color(0xFFD32F2F), Color(0xFF0097A7)];
    return colors[name.hashCode.abs() % colors.length];
  }

  Widget _buildMessageList(List<Map<String, dynamic>> msgs, bool isInbox) {
    if (msgs.isEmpty) {
      return EmptyStateWidget(
          message: isInbox ? 'No messages received' : 'No messages sent',
          icon: Icons.mail_outline);
    }
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      itemCount: msgs.length,
      itemBuilder: (_, i) {
        final m = msgs[i];
        final name = isInbox
            ? (m['sender_name'] as String? ?? 'Unknown')
            : (m['receiver_name'] as String? ?? 'Unknown');
        final role = isInbox ? m['sender_type'] : m['receiver_type'];
        final isUnread = isInbox && (m['is_read'] == 0);
        final initials = name.trim().split(' ').take(2)
            .map((w) => w.isNotEmpty ? w[0] : '').join().toUpperCase();

        return GestureDetector(
          onTap: () => _openMessage(m, isInbox),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isUnread
                  ? AppTheme.primary.withValues(alpha: 0.04)
                  : Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: isUnread
                    ? AppTheme.primary.withValues(alpha: 0.2)
                    : Colors.grey.shade200,
              ),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 4,
                    offset: const Offset(0, 1)),
              ],
            ),
            child: Row(children: [
              // Avatar
              CircleAvatar(
                radius: 20,
                backgroundColor: _avatarColor(name),
                child: Text(initials,
                    style: const TextStyle(color: Colors.white,
                        fontSize: 12, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 12),
              // Content
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: role == 'student'
                            ? const Color(0xFF1976D2)
                            : const Color(0xFF388E3C),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        (role as String? ?? '').toUpperCase(),
                        style: const TextStyle(color: Colors.white,
                            fontSize: 9, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Flexible(child: Text(name,
                        style: TextStyle(
                            fontWeight: isUnread ? FontWeight.bold : FontWeight.w600,
                            fontSize: 13),
                        overflow: TextOverflow.ellipsis)),
                    const SizedBox(width: 6),
                    Text(_fmtDate(m['created_at']),
                        style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  ]),
                  const SizedBox(height: 4),
                  Text(m['message'] ?? '',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontSize: 12,
                          color: isUnread ? Colors.black87 : Colors.grey.shade600)),
                ],
              )),
              if (isUnread)
                Container(
                  width: 8, height: 8,
                  margin: const EdgeInsets.only(left: 8),
                  decoration: const BoxDecoration(
                      color: AppTheme.primary, shape: BoxShape.circle),
                ),
            ]),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: const Color(0xFFF1F5F9),
        // ── FABs ──
        floatingActionButton: _isFaculty
            ? Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  FloatingActionButton.extended(
                    heroTag: 'announce',
                    onPressed: _showAnnouncement,
                    backgroundColor: const Color(0xFFE91E8C),
                    foregroundColor: Colors.white,
                    icon: const Icon(Icons.campaign, size: 18),
                    label: const Text('Announcement',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                  const SizedBox(height: 12),
                  FloatingActionButton.extended(
                    heroTag: 'newmsg',
                    onPressed: _showNewMessage,
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    icon: const Icon(Icons.edit, size: 18),
                    label: const Text('New Message',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                ],
              )
            : FloatingActionButton.extended(
                heroTag: 'studentmsg',
                onPressed: _showNewMessageToFaculty,
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                icon: const Icon(Icons.message, size: 18),
                label: const Text('Message Faculty',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
              ),
        body: Column(children: [
          // ── Header ──
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Column(children: [
              const Align(
                alignment: Alignment.centerLeft,
                child: Text('💬 Communication Hub',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 10),
              TabBar(
                controller: _tabController,
                labelColor: AppTheme.primary,
                unselectedLabelColor: Colors.grey,
                indicatorColor: AppTheme.primary,
                tabs: [
                  Tab(text: 'Inbox${_inbox.where((m) => m['is_read'] == 0).isNotEmpty ? ' (${_inbox.where((m) => m['is_read'] == 0).length})' : ''}'),
                  const Tab(text: 'Sent'),
                ],
              ),
            ]),
          ),
          // ── Content ──
          Expanded(
            child: _loading
                ? const LoadingWidget()
                : _error != null
                    ? AppErrorWidget(message: _error!, onRetry: _load)
                    : TabBarView(
                        controller: _tabController,
                        children: [
                          RefreshIndicator(
                              onRefresh: _load,
                              child: _buildMessageList(_inbox, true)),
                          RefreshIndicator(
                              onRefresh: _load,
                              child: _buildMessageList(_sent, false)),
                        ],
                      ),
          ),
        ]),
      );
}

Widget _lbl(String t) => Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(t,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87)),
    );

InputDecoration _dec(String hint) => InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.grey, fontSize: 13),
      filled: true,
      fillColor: const Color(0xFFF5F5F5),
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.primary)),
    );
