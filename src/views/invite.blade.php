<h2>Who do you want to invite?</h2>
<small>Add from the list of users below to invite to your conversation.</small>

{!! Form::open(['route' => ['confer.conversation.update', $conversation->id], 'class' => 'confer-invite-form']) !!}
@if ($conversation->isPrivate() && ! $potential_invitees->isEmpty())
<small>You'll also want to give your conversation a new name!</small>

<div class="confer-rename-conversation">
<!--{!! Form::label('conversation_name', 'Name') !!}-->
{!! Form::text('conversation_name', null, ['placeholder' => 'Call it something snazzy']) !!}
</div>
@endif

<ul class="confer-invite-user-list">
@if ($potential_invitees->isEmpty())
<p>Well this is awkward... you seem to have already invited everyone.</p>
@endif
@foreach ($potential_invitees as $user)

	<li data-userId="{{ $user->id }}">
		<img class="confer-user-avatar" src="{{ url('/') . config('confer.avatar_dir') . $user->avatar }}">
		<span>{{ $user->name }}</span>
		<i class="fa fa-check"></i>
	</li>

@endforeach
</ul>

<button class="confer-button confer-invite-back-button">Back to the conversation</button>
@if ( ! $potential_invitees->isEmpty())
{!! Form::submit('Invite and update the conversation', ['class' => 'confer-button confer-button-success confer-invite-save']) !!}
@endif
{!! Form::close() !!}