<h2>Your conversations</h2>
<ul class="confer-conversation-list">
@if ($conversations->isEmpty())
<p>No conversations have been started yet. Why not be the first?</p>
@else
@foreach ($conversations as $conversation)
	<li data-conversationId="{{ $conversation->id }}" @if($conversation->is_private) data-userId="{{ $conversation->participants()->ignoreMe()->first()->id }}" @endif>
	<h3>{{ $conversation->name }}</h3>
	@if ($conversation->messages->last()->type === 'user_message')
	<span class="confer-bar-user-message">
		<strong>{{ $conversation->messages->last()->sender->name }}: </strong>{!! $conversation->messages->last()->body !!}
	</span>
	@else
	<span class="confer-bar-conversation-message">
		{!! $conversation->messages->last()->body !!}
	</span>
	@endif
	</span>
	<span class="confer-bar-timestamp">{{ $conversation->messages->last()->created_at->diffForHumans() }}</span>
	</li>
@endforeach
@endif
</ul>