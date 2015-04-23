<h2>Users</h2>
<small>Find people available to converse with, and those not currently online.</small>

<ul class="confer-user-list confer-online-list">
<h3>Active</h3>
@if ( ! $users['online']->isEmpty())
	@foreach ($users['online'] as $user)
		<li data-userId="{{ $user->id }}">
			<img class="confer-user-avatar" src="{{ url('/') . config('confer.avatar_dir') . $user->avatar }}">
			<span class="confer-user-name">{{ $user->name }}</span>
		</li>
	@endforeach
@else
	<p>There are no users online (apart from you!)</p>
@endif
</ul>

<ul class="confer-user-list confer-not-online-list">
<h3>Offline</h3>
@if ( ! $users['offline']->isEmpty())
	@foreach ($users['offline'] as $user)
		<li data-userId="{{ $user->id }}">
			<img class="confer-user-avatar" src="{{ url('/') . config('confer.avatar_dir') . $user->avatar }}">
			<span class="confer-user-name">{{ $user->name }}</span>
		</li>
	@endforeach
@else
	<p>It looks like everyone is online... that's weird.</p>
</ul>
@endif