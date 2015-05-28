<h2>{{ $conversation->is_private ? 'Your private conversation with ' . $conversation->participants()->ignoreMe()->first()->name : $conversation->name }}</h2>
<small>
@if ($conversation->isGlobal())
Conversation between all users.
@else
Conversation between {{ confer_make_list($conversation->participants->lists('name')) }}.
@endif
</small>
@if ( ! $conversation->isGlobal())
<div class="confer-conversation-options">
	<i class="fa fa-user-plus confer-invite-users"></i>
	@if ($conversation->participants->count() > 2)
	<i class="fa fa-sign-out confer-leave-conversation"></i>
	@endif
</div>
@endif

<ul class="confer-conversation-message-list" data-conversationId="{{ $conversation->id }}">
	@if ( ! $messages->isEmpty() && $messages->count() > 4)
		<div class="confer-load-more-messages">
			<span>Previous messages...</span>
		</div>
	@endif
	@foreach ($messages as $message)
	@if ($message->type === 'user_message')
		<li data-messageId="{{ $message->id }}" class="{{ $message->sender->id === Auth::user()->id ? 'confer-sent-message' : 'confer-received-message' }}">
			<img class="confer-user-avatar {{ $message->sender->id === Auth::user()->id ? 'confer-sent-avatar' : 'confer-received-avatar' }}" src="{{ url('/') . config('confer.avatar_dir') . $message->sender->avatar }}">
			<div class="confer-message-inner">
				<span class="confer-message-sender">{{ $message->sender->name }}</span>
				<span class="confer-message-body">{{{ $message->body }}}</span>
				<span class="confer-message-timestamp" data-timestamp="{{ $message->created_at->toDateTimeString() }}">{{ $message->created_at->diffForHumans() }}</span>
			</div>
		</li>
	@else
		<li data-messageId="{{ $message->id }}" class="confer-conversation-message">
			<span>{!! $message->body !!}</span>
			<span class="confer-message-timestamp" data-timestamp="{{ $message->created_at->toDateTimeString() }}">{{ $message->created_at->diffForHumans() }}</span>
		</li>
	@endif
	@endforeach
</ul>

{!! Form::open(['route' => ['confer.conversation.message.store', $conversation->id], 'class' => 'confer-new-message-form']) !!}
{!! Form::label('body', 'New message') !!}
{!! Form::textarea('body', null, ['class' => 'confer-new-message-input']) !!}
{!! Form::submit('Send', ['class' => 'confer-button confer-button-neutral confer-new-message-submit']) !!}
{!! Form::close() !!}