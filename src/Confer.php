<?php

namespace DJB\Confer;
use Push;
use App\User;

class Confer {
	
	public $global = 'presence-global';
	
	public function __construct()
	{

	}

	/**
	 * Get the online/offline state of the users of the confer system
	 * 
	 * @return Array
	 */
	public function getUsersState()
	{
		$channel_info = Push::get('/channels/' . $this->global . '/users');
		$online_users = $channel_info['result']['users'];

		$online_ids = [];
		foreach ($online_users as $online_user) {
			$online_ids[] = $online_user['id'];
		}

		$users = User::ignoreMe()->get();
		$online = $users->filter(function($user) use ($online_ids) {
			return in_array($user->id, $online_ids);
		});
		$offline = $users->filter(function($user) use ($online_ids) {
			return ! in_array($user->id, $online_ids);
		});

		return ['online' => $online, 'offline' => $offline];
	}

}