<div class="confer-overlay">
	<button class="confer-overlay-close">x</button>
	<img class="confer-bar-loader" src="{{ url('/') . config('confer.loader') }}">
	<img class="confer-overlay-loader" src="{{ url('/') . config('confer.loader') }}"/>
	<div class="confer-overlay-content">
	</div>
</div>

<div class="confer-conversation-context-menu">
	<ul class="confer-conversation-context-menu-options-list">
		<li class="confer-button-mini" id="confer-context-leave-conversation">Leave</li>
		<li class="confer-button-mini" id="confer-context-close-conversation">Close</li>
	</ul>
</div>

@if (Auth::check())
<div class="confer-open-conversations">
	<ul class="confer-open-conversations-list">
    @if ($confer_conversations)
        {!! $confer_conversations !!}
    @elseif (config('confer.allow_global'))
        	<li data-conversationId="1">
	        	<div class="confer-message confer-message-east" href="#">
	        		<span class="confer-message-item">
	        			<img class="confer-open-conversation-avatar" src="{{ url('/') . config('confer.company_avatar') }}"/>
	        			<span class="confer-open-conversation-name">All</span>
	        		</span>
	        		<span class="confer-message-content">New message!</span>
	        	</div>
        	</li>
    @endif
	</ul>
	<div class="confer-icon-list">
		<i class="fa fa-weixin confer-all-conversations-icon"></i>
		<!--<i class="fa fa-cog confer-settings-icon"></i>-->
		<i class="fa fa-users confer-user-list-icon"></i>
	</div>
</div>
@endif