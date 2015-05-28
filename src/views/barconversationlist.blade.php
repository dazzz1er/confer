@if (Auth::check())
<ul class="confer-conversation-list">
@if ($bar_conversations->isEmpty())
<p style="padding: 10px;">No conversations have been started.</p>
@else
@foreach ($bar_conversations as $conversation)
	<li data-conversationId="{{ $conversation->id }}" @if($conversation->is_private) data-userId="{{ $conversation->participants()->ignoreMe()->first()->id }}" @endif>
	<h3>{{ $conversation->name }}</h3>
	@if ($conversation->messages->last()->type === 'user_message')
	<span class="confer-bar-user-message">
		<strong>{{ $conversation->messages->last()->sender->name }}: </strong>{{{ $conversation->messages->last()->body }}}
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
<button class="confer-button confer-button-neutral confer-show-all-conversations">See all conversations</button>
@endif