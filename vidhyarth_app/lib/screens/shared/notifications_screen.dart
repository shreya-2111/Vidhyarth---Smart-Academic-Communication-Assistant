import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/date_utils.dart';
import '../../core/constants/app_constants.dart';
import '../../models/notification_model.dart';
import '../../services/api_service.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/loading_widget.dart';

class NotificationsScreen extends StatefulWidget {
  final int userId;
  final String userType;
  final bool showAppBar;
  const NotificationsScreen({
    super.key, 
    required this.userId, 
    required this.userType,
    this.showAppBar = true,
  });

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<NotificationModel> _notifications = [];
  List<dynamic> _announcements = [];
  bool _notificationsLoading = true;
  bool _announcementsLoading = true;
  String? _notificationsError;
  String? _announcementsError;

  @override
  void initState() {
    super.initState();
    print('NotificationsScreen initialized for user ${widget.userId}, type ${widget.userType}');
    _loadNotifications();
    _loadAnnouncements();
    
    // Add timeout to prevent infinite loading
    Future.delayed(const Duration(seconds: 10), () {
      if (mounted && (_notificationsLoading || _announcementsLoading)) {
        print('Timeout reached - stopping loading');
        setState(() {
          if (_notificationsLoading) {
            _notificationsLoading = false;
            _notificationsError = 'Request timeout. Please check your connection and try again.';
          }
          if (_announcementsLoading) {
            _announcementsLoading = false;
            _announcementsError = 'Request timeout. Please check your connection and try again.';
          }
        });
      }
    });
  }

  Future<void> _loadNotifications() async {
    setState(() {
      _notificationsLoading = true;
      _notificationsError = null;
    });
    try {
      print('Loading notifications for user ${widget.userId}, type ${widget.userType}');
      print('API Base URL: ${AppConstants.baseUrl}');
      
      final data = await apiService
          .get('/notifications/${widget.userId}/${widget.userType}')
          .timeout(const Duration(seconds: 8));
      print('Notifications response: $data');
      final list = (data['notifications'] as List?) ?? [];
      setState(() {
        _notifications = list.map((e) => NotificationModel.fromJson(e)).toList();
        _notificationsLoading = false;
      });
      print('Loaded ${_notifications.length} notifications');
    } catch (e) {
      print('Error loading notifications: $e');
      setState(() {
        _notificationsError = 'Unable to load notifications. Please check your internet connection and try again.';
        _notificationsLoading = false;
      });
    }
  }

  Future<void> _loadAnnouncements() async {
    setState(() {
      _announcementsLoading = true;
      _announcementsError = null;
    });
    try {
      print('Loading announcements for user ${widget.userId}');
      final data = await apiService
          .get('/messages/student-announcements/${widget.userId}')
          .timeout(const Duration(seconds: 8));
      print('Announcements response: $data');
      setState(() {
        _announcements = data as List? ?? [];
        _announcementsLoading = false;
      });
      print('Loaded ${_announcements.length} announcements');
    } catch (e) {
      print('Error loading announcements: $e');
      setState(() {
        _announcementsError = 'Unable to load announcements. Please check your internet connection and try again.';
        _announcementsLoading = false;
      });
    }
  }

  Future<void> _markAllRead() async {
    try {
      await apiService.put(
          '/notifications/read-all/${widget.userId}/${widget.userType}', {});
      _loadNotifications();
    } catch (_) {}
  }

  Color _priorityColor(String priority) {
    switch (priority) {
      case 'high':
        return AppTheme.error;
      case 'medium':
        return AppTheme.warning;
      default:
        return AppTheme.accent;
    }
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'deadline':
        return Icons.schedule;
      case 'submission':
        return Icons.assignment_turned_in;
      case 'announcement':
        return Icons.campaign;
      default:
        return Icons.notifications;
    }
  }

  Widget _buildNotificationsTab() {
    if (_notificationsLoading) {
      return const LoadingWidget();
    }

    if (_notificationsError != null) {
      return AppErrorWidget(
        message: _notificationsError!,
        onRetry: _loadNotifications,
      );
    }

    return Column(
      children: [
        if (_notifications.any((n) => !n.isRead))
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: _markAllRead,
                child: const Text('Mark all as read'),
              ),
            ),
          ),
        Expanded(
          child: _notifications.isEmpty
              ? const EmptyStateWidget(
                  message: 'No notifications yet',
                  icon: Icons.notifications_none)
              : RefreshIndicator(
                  onRefresh: _loadNotifications,
                  child: ListView.builder(
                    itemCount: _notifications.length,
                    itemBuilder: (_, i) {
                      final n = _notifications[i];
                      return Dismissible(
                        key: Key(n.notificationId.toString()),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          color: AppTheme.error,
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 16),
                          child: const Icon(Icons.delete, color: Colors.white),
                        ),
                        onDismissed: (_) async {
                          await apiService
                              .delete('/notifications/${n.notificationId}');
                          setState(() => _notifications.removeAt(i));
                        },
                        child: ListTile(
                          tileColor: n.isRead
                              ? null
                              : AppTheme.primary.withValues(alpha: 0.04),
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: _priorityColor(n.priority).withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(_typeIcon(n.type),
                                color: _priorityColor(n.priority), size: 20),
                          ),
                          title: Text(n.title,
                              style: TextStyle(
                                  fontWeight: n.isRead
                                      ? FontWeight.normal
                                      : FontWeight.bold)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(n.message,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 12)),
                              Text(AppDateUtils.timeAgo(n.createdAt),
                                  style: const TextStyle(
                                      fontSize: 11, color: Colors.grey)),
                            ],
                          ),
                          isThreeLine: true,
                          onTap: () async {
                            if (!n.isRead) {
                              await apiService.put(
                                  '/notifications/mark-read/${n.notificationId}',
                                  {});
                              _loadNotifications();
                            }
                          },
                        ),
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildAnnouncementsTab() {
    if (_announcementsLoading) {
      return const LoadingWidget();
    }

    if (_announcementsError != null) {
      return AppErrorWidget(
        message: _announcementsError!,
        onRetry: _loadAnnouncements,
      );
    }

    return _announcements.isEmpty
        ? const EmptyStateWidget(
            message: 'No announcements yet',
            icon: Icons.campaign_outlined)
        : RefreshIndicator(
            onRefresh: _loadAnnouncements,
            child: ListView.builder(
              itemCount: _announcements.length,
              itemBuilder: (_, i) {
                final announcement = _announcements[i];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.campaign,
                                color: AppTheme.primary,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    announcement['title'] ?? 'Announcement',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                  Text(
                                    'By ${announcement['faculty_name'] ?? 'Faculty'}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          announcement['message'] ?? '',
                          style: const TextStyle(fontSize: 14),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            if (announcement['target_type'] != null)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppTheme.accent.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  announcement['target_type'] == 'all'
                                      ? 'All Students'
                                      : announcement['target_type'] == 'division'
                                          ? 'Division ${announcement['target_value']}'
                                          : 'Department',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: AppTheme.accent,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            Text(
                              AppDateUtils.timeAgo(announcement['created_at']),
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: widget.showAppBar 
        ? Scaffold(
            appBar: AppBar(
              title: const Text('Notifications'),
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              bottom: const TabBar(
                indicatorColor: Colors.white,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white70,
                tabs: [
                  Tab(text: 'Notifications'),
                  Tab(text: 'Announcements'),
                ],
              ),
            ),
            body: TabBarView(
              children: [
                _buildNotificationsTab(),
                _buildAnnouncementsTab(),
              ],
            ),
          )
        : Column(
            children: [
              Container(
                color: AppTheme.primary,
                child: const TabBar(
                  indicatorColor: Colors.white,
                  labelColor: Colors.white,
                  unselectedLabelColor: Colors.white70,
                  tabs: [
                    Tab(text: 'Notifications'),
                    Tab(text: 'Announcements'),
                  ],
                ),
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    _buildNotificationsTab(),
                    _buildAnnouncementsTab(),
                  ],
                ),
              ),
            ],
          ),
    );
  }
}