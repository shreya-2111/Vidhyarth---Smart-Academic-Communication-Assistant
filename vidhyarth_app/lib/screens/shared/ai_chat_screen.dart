import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';
import '../../services/api_service.dart';

class AiChatScreen extends StatefulWidget {
  const AiChatScreen({super.key});

  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  final TextEditingController _ctrl = TextEditingController();
  final ScrollController _scroll = ScrollController();
  final List<_Msg> _messages = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _messages.add(_Msg(
      text: "Hi! I'm Vidhya AI ✨\nI can help with academics, your timetable, assignments, attendance, or anything else on your mind.",
      isUser: false,
      time: DateTime.now(),
    ));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send([String? text]) async {
    final msg = (text ?? _ctrl.text).trim();
    if (msg.isEmpty || _loading) return;

    _ctrl.clear();
    setState(() {
      _messages.add(_Msg(text: msg, isUser: true, time: DateTime.now()));
      _loading = true;
    });
    _scrollToBottom();

    try {
      final data = await apiService.post('/chatbot', {'message': msg});
      setState(() {
        _messages.add(_Msg(
          text: data['response'] ?? 'No response',
          isUser: false,
          time: DateTime.now(),
        ));
      });
    } catch (e) {
      setState(() {
        _messages.add(_Msg(
          text: "I ran into a hiccup. Could you try rephrasing or asking again?",
          isUser: false,
          time: DateTime.now(),
          isError: true,
        ));
      });
    } finally {
      setState(() => _loading = false);
      _scrollToBottom();
    }
  }

  Future<void> _clearChat() async {
    try {
      await apiService.delete('/chatbot/history');
    } catch (_) {}
    setState(() {
      _messages.clear();
      _messages.add(_Msg(
        text: "Chat cleared! How can I help you?",
        isUser: false,
        time: DateTime.now(),
      ));
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // ── Header bar ──
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Text('✨', style: TextStyle(fontSize: 18)),
                ),
              ),
              const SizedBox(width: 10),
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Vidhya AI',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 15)),
                  Row(
                    children: [
                      CircleAvatar(
                          radius: 4, backgroundColor: Color(0xFF4ADE80)),
                      SizedBox(width: 4),
                      Text('Online',
                          style:
                              TextStyle(color: Colors.white70, fontSize: 11)),
                    ],
                  ),
                ],
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.delete_outline,
                    color: Colors.white70, size: 20),
                tooltip: 'Clear chat',
                onPressed: _clearChat,
              ),
            ],
          ),
        ),

        // ── Messages ──
        Expanded(
          child: ListView.builder(
            controller: _scroll,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            itemCount: _messages.length + (_loading ? 1 : 0),
            itemBuilder: (_, i) {
              if (i == _messages.length) return _TypingIndicator();
              return _BubbleTile(msg: _messages[i]);
            },
          ),
        ),

        const SizedBox(height: 6),

        // ── Input bar ──
        Container(
          margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFFE0E7FF)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _ctrl,
                  minLines: 1,
                  maxLines: 4,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _send(),
                  decoration: const InputDecoration(
                    hintText: 'Ask me anything...',
                    hintStyle: TextStyle(color: Colors.grey, fontSize: 14),
                    border: InputBorder.none,
                    contentPadding:
                        EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 6),
                child: GestureDetector(
                  onTap: _loading ? null : () => _send(),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      gradient: _loading
                          ? null
                          : const LinearGradient(
                              colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)]),
                      color: _loading ? Colors.grey.shade300 : null,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.send_rounded,
                      color: _loading ? Colors.grey : Colors.white,
                      size: 18,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Message model ──
class _Msg {
  final String text;
  final bool isUser;
  final DateTime time;
  final bool isError;

  _Msg({
    required this.text,
    required this.isUser,
    required this.time,
    this.isError = false,
  });
}

// ── Chat bubble ──
class _BubbleTile extends StatelessWidget {
  final _Msg msg;
  const _BubbleTile({required this.msg});

  @override
  Widget build(BuildContext context) {
    final isUser = msg.isUser;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) ...[
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                    colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)]),
                shape: BoxShape.circle,
              ),
              child: const Center(
                  child: Text('✨', style: TextStyle(fontSize: 13))),
            ),
            const SizedBox(width: 6),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: isUser
                        ? const LinearGradient(colors: [
                            Color(0xFF4F46E5),
                            Color(0xFF7C3AED)
                          ])
                        : null,
                    color: isUser
                        ? null
                        : msg.isError
                            ? const Color(0xFFFEF2F2)
                            : const Color(0xFFF5F3FF),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isUser ? 16 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 16),
                    ),
                    border: isUser
                        ? null
                        : Border.all(
                            color: msg.isError
                                ? const Color(0xFFFECACA)
                                : const Color(0xFFE0E7FF)),
                  ),
                  child: Text(
                    msg.text,
                    style: TextStyle(
                      color: isUser
                          ? Colors.white
                          : msg.isError
                              ? const Color(0xFFDC2626)
                              : const Color(0xFF1F2937),
                      fontSize: 14,
                      height: 1.45,
                    ),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _fmtTime(msg.time),
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                ),
              ],
            ),
          ),
          if (isUser) const SizedBox(width: 6),
        ],
      ),
    );
  }

  String _fmtTime(DateTime t) {
    final h = t.hour % 12 == 0 ? 12 : t.hour % 12;
    final m = t.minute.toString().padLeft(2, '0');
    final suffix = t.hour >= 12 ? 'PM' : 'AM';
    return '$h:$m $suffix';
  }
}

// ── Typing indicator ──
class _TypingIndicator extends StatefulWidget {
  @override
  State<_TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<_TypingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _anim = Tween(begin: 0.3, end: 1.0).animate(_ctrl);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                  colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)]),
              shape: BoxShape.circle,
            ),
            child: const Center(
                child: Text('✨', style: TextStyle(fontSize: 13))),
          ),
          const SizedBox(width: 6),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFF5F3FF),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE0E7FF)),
            ),
            child: FadeTransition(
              opacity: _anim,
              child: Row(
                children: List.generate(
                  3,
                  (i) => Padding(
                    padding: EdgeInsets.only(left: i == 0 ? 0 : 4),
                    child: const CircleAvatar(
                        radius: 4,
                        backgroundColor: Color(0xFF4F46E5)),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
